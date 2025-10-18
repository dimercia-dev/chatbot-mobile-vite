// services/authApi.js

// ✅ Utiliser la variable d'environnement (production) ou localhost (développement)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const AUTH_API_URL = `${API_URL}/api/auth`;

class AuthApiService {
  constructor() {
    this.baseURL = AUTH_API_URL;
  }

  // Générer ou récupérer device ID
  getDeviceId() {
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = `device_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('deviceId', deviceId);
    }
    return deviceId;
  }

  // Inscription
  async signup(userData) {
    const { username, email, password, confirmPassword } = userData;

    // Validations côté client
    if (!username?.trim() || !email?.trim() || !password?.trim()) {
      throw new Error("Tous les champs sont requis");
    }

    if (password !== confirmPassword) {
      throw new Error("Les mots de passe ne correspondent pas");
    }

    if (password.length < 6) {
      throw new Error("Le mot de passe doit contenir au moins 6 caractères");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Adresse email invalide");
    }

    try {
      const response = await fetch(`${this.baseURL}/signup`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim().toLowerCase(),
          password,
          deviceId: this.getDeviceId()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Erreur HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
      }
      throw error;
    }
  }

  // Vérification d'email
  async verifyEmail(token) {
    try {
      const response = await fetch(`${this.baseURL}/verify/${token}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Token invalide');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Connexion
  async login(credentials) {
    const { email, password } = credentials;

    if (!email?.trim() || !password?.trim()) {
      throw new Error("Email et mot de passe requis");
    }

    try {
      const response = await fetch(`${this.baseURL}/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          deviceId: this.getDeviceId()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Erreur HTTP ${response.status}`);
      }

      // Sauvegarder la session
      if (data.data.sessionToken) {
        localStorage.setItem('sessionToken', data.data.sessionToken);
        localStorage.setItem('userInfo', JSON.stringify(data.data.user));
      }

      return data;
    } catch (error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion.");
      }
      throw error;
    }
  }

  // Déconnexion
  async logout() {
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      
      if (sessionToken) {
        await fetch(`${this.baseURL}/logout`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({ sessionToken })
        });
      }

      // ✅ Nettoyer UNIQUEMENT les données de session
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userInfo');
      // NE PAS supprimer deviceId ni les autres données
      
    } catch (error) {
      // Nettoyer même en cas d'erreur
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('userInfo');
      console.warn('Erreur lors de la déconnexion:', error);
    }
  }

  // Vérifier session existante
  async checkExistingSession() {
    const sessionToken = localStorage.getItem('sessionToken');
    const userInfo = localStorage.getItem('userInfo');

    if (!sessionToken || !userInfo) {
      return null;
    }

    // Simplement retourner les infos locales sans vérifier avec le serveur
    try {
      return JSON.parse(userInfo);
    } catch (error) {
      this.logout();
      return null;
    }
  }

  // Obtenir l'utilisateur actuel
  getCurrentUser() {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated() {
    const sessionToken = localStorage.getItem('sessionToken');
    const userInfo = localStorage.getItem('userInfo');
    return !!(sessionToken && userInfo);
  }

  // Obtenir le token de session
  getSessionToken() {
    return localStorage.getItem('sessionToken');
  }
}

export default new AuthApiService();