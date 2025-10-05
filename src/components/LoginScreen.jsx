// components/LoginScreen.jsx
import React, { useState, useEffect } from 'react';
import { Bot, Eye, EyeOff, Loader2, Mail, User, Lock, ArrowRight } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const LoginScreen = () => {
  const {
    handleLogin,
    handleSignup,
    authLoading,
    getThemeClasses,
    showNotification
  } = useChatContext();

  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerificationStep, setEmailVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const theme = getThemeClasses();

  // Reset form when switching between login/signup
  useEffect(() => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [isSignup]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSignup) {
      const result = await handleSignup(formData);
      if (result.success) {
        setEmailVerificationStep(true);
      }
    } else {
      const result = await handleLogin({
        email: formData.email,
        password: formData.password
      });
      
      if (!result.success && result.error?.includes('vérifiez')) {
        setEmailVerificationStep(true);
      }
    }
  };

  const handleEmailVerification = async () => {
    if (!verificationCode.trim()) {
      showNotification("Veuillez entrer le code de vérification", "error");
      return;
    }

    try {
      // Ici vous pourrez ajouter l'appel à l'API de vérification
      showNotification("Email vérifié ! Vous pouvez maintenant vous connecter.", "success");
      setEmailVerificationStep(false);
      setIsSignup(false);
      setVerificationCode('');
    } catch (error) {
      showNotification("Code de vérification invalide", "error");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (emailVerificationStep) {
        handleEmailVerification();
      } else {
        handleSubmit(e);
      }
    }
  };

  if (emailVerificationStep) {
    return (
      <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
        <div className={`w-full max-w-md ${theme.card} rounded-3xl shadow-2xl p-8 border animate-fade-in`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-pulse">
              <Mail className="w-10 h-10 text-white"/>
            </div>
            <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>Vérifiez votre email</h1>
            <p className={`${theme.textSecondary} text-sm`}>
              Un email de vérification a été envoyé à votre adresse. Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                Code de vérification (optionnel)
              </label>
              <input 
                type="text" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                onKeyPress={handleKeyPress}
                placeholder="Entrez le code si vous l'avez reçu" 
                className={`w-full px-4 py-3 rounded-2xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`}
              />
            </div>

            <button 
              onClick={handleEmailVerification}
              className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] font-semibold shadow-xl flex items-center justify-center gap-2"
            >
              <Mail className="w-4 h-4"/>
              Vérifier maintenant
            </button>

            <div className="text-center">
              <button
                onClick={() => setEmailVerificationStep(false)}
                className={`text-sm ${theme.textSecondary} hover:${theme.text} transition-colors`}
              >
                Retour à la connexion
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${theme.card} rounded-3xl shadow-2xl p-8 border animate-slide-up`}>
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl transform hover:scale-105 transition-transform">
            <Bot className="w-10 h-10 text-white"/>
          </div>
          <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>Assistant IA Pro</h1>
          <p className={`${theme.textSecondary} text-sm`}>
            {isSignup ? "Créez votre compte pour commencer" : "Connectez-vous pour continuer"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Nom d'utilisateur */}
          <div className="relative">
            <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
              {isSignup ? "Nom complet" : "Email ou nom d'utilisateur"}
            </label>
            <div className="relative">
              <input
                type="text"
                name={isSignup ? "username" : "email"}
                value={isSignup ? formData.username : formData.email}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={isSignup ? "Entrez votre nom complet" : "Email ou nom d'utilisateur"}
                className={`w-full pl-12 pr-4 py-3 rounded-2xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                disabled={authLoading}
                required
              />
              <User className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`}/>
            </div>
          </div>

          {/* Email (inscription seulement) */}
          {isSignup && (
            <div className="relative">
              <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                Adresse email
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="votre@email.com"
                  className={`w-full pl-12 pr-4 py-3 rounded-2xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  disabled={authLoading}
                  required
                />
                <Mail className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`}/>
              </div>
            </div>
          )}

          {/* Mot de passe */}
          <div className="relative">
            <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
              Mot de passe
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                className={`w-full pl-12 pr-12 py-3 rounded-2xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                disabled={authLoading}
                required
                minLength={isSignup ? 6 : 1}
              />
              <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`}/>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${theme.textSecondary} hover:${theme.text} transition-colors`}
              >
                {showPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
              </button>
            </div>
          </div>

          {/* Confirmer mot de passe (inscription seulement) */}
          {isSignup && (
            <div className="relative">
              <label className={`block text-sm font-semibold ${theme.text} mb-2`}>
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-12 py-3 rounded-2xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  disabled={authLoading}
                  required
                  minLength={6}
                />
                <Lock className={`absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 ${theme.textSecondary}`}/>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-4 top-1/2 transform -translate-y-1/2 ${theme.textSecondary} hover:${theme.text} transition-colors`}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5"/> : <Eye className="w-5 h-5"/>}
                </button>
              </div>
            </div>
          )}

          {/* Bouton de soumission */}
          <button 
            type="submit"
            disabled={authLoading}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none font-semibold shadow-xl group flex items-center justify-center gap-2"
          >
            {authLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin"/>
                {isSignup ? "Création en cours..." : "Connexion en cours..."}
              </>
            ) : (
              <>
                {isSignup ? "Créer mon compte" : "Se connecter"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </>
            )}
          </button>

          {/* Actions alternatives */}
          <div className="space-y-4">
            {!isSignup && (
              <div className="text-center">
                <button 
                  type="button"
                  onClick={() => showNotification("Fonctionnalité à venir", "info")}
                  className={`text-sm ${theme.textSecondary} hover:${theme.text} transition-colors underline`}
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-2">
              <span className={`text-sm ${theme.textSecondary}`}>
                {isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"}
              </span>
              <button
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-sm text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                disabled={authLoading}
              >
                {isSignup ? "Se connecter" : "S'inscrire"}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs ${theme.textSecondary}`}>
            En continuant, vous acceptez nos{' '}
            <button 
              onClick={() => showNotification("Conditions d'utilisation", "info")}
              className="text-blue-500 hover:text-blue-600 underline"
            >
              Conditions d'utilisation
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;