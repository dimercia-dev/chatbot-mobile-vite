// src/context/ChatContext.jsx - VERSION RÉELLEMENT COMPLÈTE
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';

const ChatContext = createContext();

// Configuration des endpoints
const API_BASE = "https://n8n-latest-taz3.onrender.com/webhook/mobile-chat";
const API_KEY = "prod_VFxiwv0FlnnQa0Tw7B3kVsZ3_Txvg6Mgvfkd20O3xh4";

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // ============= ÉTATS DE BASE =============
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState("login");
  
  // ============= PRÉFÉRENCES UI =============
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('fontSize') || 'medium';
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('soundEnabled');
    return saved ? JSON.parse(saved) : true;
  });
  
  // ============= CONVERSATION =============
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationHistory, setConversationHistory] = useState(() => {
    const saved = localStorage.getItem('conversationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  
  // ============= STATUT =============
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substr(2, 9)}`);
  
  // ============= UI INTERACTIONS =============
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  
  // ============= FONCTIONNALITÉS AVANCÉES =============
  const [pinnedMessages, setPinnedMessages] = useState(() => {
    const saved = localStorage.getItem('pinnedMessages');
    return saved ? JSON.parse(saved) : [];
  });
  const [favoriteConversations, setFavoriteConversations] = useState(() => {
    const saved = localStorage.getItem('favoriteConversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(() => {
    const saved = localStorage.getItem('ttsEnabled');
    return saved ? JSON.parse(saved) : false;
  });
  const [ttsVoice, setTtsVoice] = useState('fr-FR');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // ============= SAUVEGARDES LOCALSTORAGE =============
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('pinnedMessages', JSON.stringify(pinnedMessages));
  }, [pinnedMessages]);

  useEffect(() => {
    localStorage.setItem('favoriteConversations', JSON.stringify(favoriteConversations));
  }, [favoriteConversations]);

  useEffect(() => {
    localStorage.setItem('ttsEnabled', JSON.stringify(ttsEnabled));
  }, [ttsEnabled]);

  // ============= SESSION EXISTANTE =============
  useEffect(() => {
    const checkExistingSession = async () => {
      setAuthLoading(true);
      try {
        const existingUser = await authApi.checkExistingSession();
        if (existingUser) {
          setUser(existingUser);
          setIsAuthenticated(true);
          setCurrentView("chat");
          
          // TEMPORAIREMENT COMMENTÉ pour debug
          // await syncConversationsFromServer(existingUser.id);
          
          const savedCurrentConv = localStorage.getItem('currentConversationId');
          if (savedCurrentConv && conversationHistory.length > 0) {
            const conv = conversationHistory.find(c => c.id === savedCurrentConv);
            if (conv) {
              loadConversation(conv.id);
            } else {
              await initializeChat(existingUser.nom);
            }
          } else {
            await initializeChat(existingUser.nom);
          }
        }
      } catch (error) {
        console.warn('Erreur vérification session:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkExistingSession();
  }, []);

  // ============= NOTIFICATIONS =============
  const showNotification = useCallback((message, type = "info", duration = 4000) => {
    const notificationId = Date.now();
    setNotification({ message, type, id: notificationId });
    if (type === "success" && soundEnabled) {
      playNotificationSound();
    }
    setTimeout(() => {
      setNotification(prev => prev?.id === notificationId ? null : prev);
    }, duration);
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (soundEnabled) {
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCz2W3/LFeSMFl2+z6NuWQ2U=');
        audio.play().catch(() => {});
      } catch (error) {
        console.warn('Erreur son:', error);
      }
    }
  }, [soundEnabled]);

  // ============= INITIALISATION CHAT =============
  const initializeChat = useCallback(async (userName = null) => {
    const name = userName || user?.nom || "utilisateur";
    const welcomeMessage = {
      id: `msg_welcome_${Date.now()}`,
      text: `Bonjour ${name} ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?`,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: "delivered",
      formatted: true,
      isWelcome: true
    };
    setMessages([welcomeMessage]);
    setConnectionStatus("connected");
  }, [user]);

  // ============= GESTION CONVERSATIONS =============
  const saveCurrentConversation = useCallback(() => {
    if (currentConversation && messages.length > 0) {
      // Filtrer les messages de bienvenue
      const messagesToSave = messages.filter(msg => !msg.isWelcome);
      
      // Ne sauvegarder que si il y a des vrais messages (pas juste le welcome)
      if (messagesToSave.length === 0) {
        console.log('⏭️  Pas de messages à sauvegarder (seulement message de bienvenue)');
        return;
      }

      const convToSave = {
        id: currentConversation,
        title: messagesToSave[0]?.text?.substring(0, 50) + '...' || "Nouvelle conversation",
        messages: messagesToSave,
        createdAt: new Date(),
        lastMessage: messagesToSave[messagesToSave.length - 1]?.text,
        tags: [],
        isFavorite: favoriteConversations.includes(currentConversation)
      };
      
      setConversationHistory(prev => {
        const filtered = prev.filter(c => c.id !== currentConversation);
        return [convToSave, ...filtered].slice(0, 50);
      });
      
      localStorage.setItem('currentConversationId', currentConversation);
      console.log('💾 Conversation sauvegardée:', currentConversation, messagesToSave.length, 'messages');
    }
  }, [currentConversation, messages, favoriteConversations]);

  // Auto-sauvegarde
  useEffect(() => {
    if (messages.length > 0) {
      const timeoutId = setTimeout(() => {
        saveCurrentConversation();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, saveCurrentConversation]);

  const loadConversation = useCallback((conversationId) => {
    const conv = conversationHistory.find(c => c.id === conversationId);
    if (conv) {
      // Sauvegarder l'ancienne conversation si différente
      if (currentConversation && currentConversation !== conversationId) {
        saveCurrentConversation();
      }
      
      setCurrentConversation(conversationId);
      
      // Charger UNIQUEMENT les messages de la conversation (PAS de message de bienvenue)
      const loadedMessages = conv.messages || [];
      setMessages(loadedMessages);
      
      setCurrentView("chat");
      setSidebarOpen(false);
      localStorage.setItem('currentConversationId', conversationId);
      
      console.log('📂 Conversation chargée:', conversationId, loadedMessages.length, 'messages');
      showNotification(`"${conv.title.substring(0, 30)}..." chargée`, "success", 2000);
    } else {
      showNotification("Conversation introuvable", "error");
    }
  }, [conversationHistory, currentConversation, saveCurrentConversation, showNotification]);

  const createNewConversation = useCallback(() => {
    // Sauvegarder la conversation actuelle
    if (currentConversation && messages.length > 0) {
      saveCurrentConversation();
    }
    
    const newConvId = `conv_${Date.now()}`;
    setCurrentConversation(newConvId);
    setMessages([]);
    setSidebarOpen(false);
    
    // Message de bienvenue pour nouvelle conversation
    if (user) {
      initializeChat(user.nom);
    } else {
      initializeChat();
    }
    
    localStorage.setItem('currentConversationId', newConvId);
    console.log('🆕 Nouvelle conversation:', newConvId);
    showNotification("Nouvelle conversation créée", "success", 2000);
  }, [currentConversation, messages, saveCurrentConversation, user, initializeChat, showNotification]);

  // ============= SYNCHRONISATION SERVEUR =============
  const syncConversationsFromServer = useCallback(async (userId) => {
    try {
      const response = await fetch(`${API_BASE}/get-conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) throw new Error('Erreur synchronisation');

      const data = await response.json();
      if (data.success && data.conversations) {
        const serverConvs = data.conversations.map(conv => ({
          id: conv.session_id,
          title: conv.title,
          messages: conv.messages_json,
          createdAt: new Date(conv.created_at),
          lastMessage: conv.messages_json[conv.messages_json.length - 1]?.text,
          tags: conv.tags || [],
          isFavorite: favoriteConversations.includes(conv.session_id),
          messageCount: conv.message_count
        }));

        setConversationHistory(serverConvs);
        console.log('🔄 Conversations synchronisées:', serverConvs.length);
        showNotification("Conversations synchronisées", "success", 2000);
      }
    } catch (error) {
      console.warn('Erreur sync:', error);
    }
  }, [favoriteConversations, showNotification]);

  // ============= RECHERCHE =============
  const searchConversations = useCallback(async (query) => {
    if (!query.trim() || !user) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`${API_BASE}/search-conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ 
          userId: user.id, 
          query: query.trim() 
        }),
      });

      if (!response.ok) throw new Error('Erreur recherche');

      const data = await response.json();
      if (data.success) {
        setSearchResults(data.results || []);
        showNotification(`${data.results.length} résultat(s) trouvé(s)`, "success", 2000);
        return data.results;
      }
    } catch (error) {
      showNotification("Erreur de recherche", "error");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  }, [user, showNotification]);

  // ============= EXPORT PDF =============
  const exportConversationToPDF = useCallback(async (conversationId) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/export-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ 
          conversationId, 
          userId: user.id 
        }),
      });

      if (!response.ok) throw new Error('Erreur export');

      const data = await response.json();
      if (data.success) {
        const blob = new Blob([data.html], { type: 'text/html' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.filename || 'conversation.html';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification("Conversation exportée", "success");
      }
    } catch (error) {
      showNotification("Erreur d'export", "error");
      console.error(error);
    }
  }, [user, showNotification]);

  // ============= TAGS =============
  const updateConversationTags = useCallback(async (conversationId, tags) => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE}/update-tags`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ 
          sessionId: conversationId, 
          userId: user.id,
          tags 
        }),
      });

      if (!response.ok) throw new Error('Erreur tags');

      const data = await response.json();
      if (data.success) {
        setConversationHistory(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, tags } 
              : conv
          )
        );
        
        showNotification("Tags mis à jour", "success", 2000);
      }
    } catch (error) {
      showNotification("Erreur de mise à jour", "error");
      console.error(error);
    }
  }, [user, showNotification]);

  // ============= SUPPRESSION =============
  const deleteConversation = useCallback(async (conversationId) => {
    if (!user) return;

    if (!window.confirm("Supprimer cette conversation ?")) return;

    try {
      const response = await fetch(`${API_BASE}/delete-conversation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
        },
        body: JSON.stringify({ 
          conversationId, 
          userId: user.id 
        }),
      });

      if (!response.ok) throw new Error('Erreur suppression');

      const data = await response.json();
      if (data.success) {
        setConversationHistory(prev => 
          prev.filter(conv => conv.id !== conversationId)
        );
        
        if (currentConversation === conversationId) {
          createNewConversation();
        }
        
        showNotification("Conversation supprimée", "success");
      }
    } catch (error) {
      showNotification("Erreur de suppression", "error");
      console.error(error);
    }
  }, [user, currentConversation, showNotification, createNewConversation]);

  // ============= FAVORIS =============
  const toggleFavorite = useCallback((conversationId) => {
    setFavoriteConversations(prev => {
      const isFav = prev.includes(conversationId);
      const updated = isFav 
        ? prev.filter(id => id !== conversationId)
        : [...prev, conversationId];
      
      setConversationHistory(convs => 
        convs.map(conv => 
          conv.id === conversationId 
            ? { ...conv, isFavorite: !isFav }
            : conv
        )
      );
      
      showNotification(
        isFav ? "Retiré des favoris" : "Ajouté aux favoris", 
        "success", 
        2000
      );
      
      return updated;
    });
  }, [showNotification]);

  // ============= TTS =============
  const speakText = useCallback((text) => {
    if (!ttsEnabled || !('speechSynthesis' in window)) {
      showNotification("Synthèse vocale non disponible", "error");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = ttsVoice;
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      showNotification("Erreur de lecture", "error");
    };

    window.speechSynthesis.speak(utterance);
  }, [ttsEnabled, ttsVoice, isSpeaking, showNotification]);

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // ============= PARTAGE =============
  const shareConversation = useCallback(async (conversationId) => {
    const conv = conversationHistory.find(c => c.id === conversationId);
    if (!conv) return;

    const shareText = `Conversation: ${conv.title}\n\n${conv.messages.map(m => 
      `${m.sender === 'user' ? 'Moi' : 'Assistant'}: ${m.text}`
    ).join('\n\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: conv.title,
          text: shareText
        });
        showNotification("Partagé avec succès", "success");
      } catch (error) {
        if (error.name !== 'AbortError') {
          copyToClipboard(shareText);
        }
      }
    } else {
      copyToClipboard(shareText);
    }
  }, [conversationHistory, showNotification]);

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Copié dans le presse-papiers", "success", 2000);
    }).catch(() => {
      showNotification("Erreur de copie", "error");
    });
  }, [showNotification]);

  // ============= MESSAGES ÉPINGLÉS =============
  const togglePinMessage = useCallback((messageId) => {
    setPinnedMessages(prev => {
      const isPinned = prev.includes(messageId);
      const updated = isPinned 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId];
      
      showNotification(
        isPinned ? "Message désépinglé" : "Message épinglé", 
        "success", 
        2000
      );
      
      return updated;
    });
  }, [showNotification]);

  // ============= AUTHENTIFICATION =============
  const handleLogin = useCallback(async (credentials) => {
    setAuthLoading(true);
    try {
      const response = await authApi.login(credentials);
      setUser(response.data.user);
      setIsAuthenticated(true);
      setCurrentView("chat");
      
      const newConvId = `conv_${Date.now()}`;
      setCurrentConversation(newConvId);
      
      await syncConversationsFromServer(response.data.user.id);
      await initializeChat(response.data.user.nom);
      
      showNotification(`Bienvenue ${response.data.user.nom} !`, "success");
      return { success: true };
    } catch (error) {
      showNotification(error.message, "error");
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  }, [initializeChat, showNotification, syncConversationsFromServer]);

  const handleSignup = useCallback(async (userData) => {
    setAuthLoading(true);
    try {
      const response = await authApi.signup(userData);
      showNotification(response.data.message, "success");
      return { success: true, data: response.data };
    } catch (error) {
      showNotification(error.message, "error");
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  }, [showNotification]);

  const handleLogout = useCallback(async () => {
    saveCurrentConversation();
    
    try {
      await authApi.logout();
    } catch (error) {
      console.warn('Erreur déconnexion:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setMessages([]);
      setCurrentConversation(null);
      setCurrentView("login");
      setConnectionStatus("disconnected");
      localStorage.removeItem('currentConversationId');
      showNotification("À bientôt !", "info");
    }
  }, [saveCurrentConversation, showNotification]);

  // ============= AUTRES FONCTIONS =============
  const clearChat = useCallback(() => {
    if (window.confirm("Effacer cette conversation ?")) {
      setMessages([]);
      showNotification("Conversation effacée", "info");
      if (user) {
        initializeChat(user.nom);
      } else {
        initializeChat();
      }
    }
  }, [showNotification, initializeChat, user]);

  const copyMessage = useCallback((text) => {
    copyToClipboard(text);
  }, [copyToClipboard]);

  const toggleAttachMenu = useCallback(() => {
    setShowAttachMenu(prev => !prev);
    setShowOptionsMenu(false);
  }, []);

  const toggleOptionsMenu = useCallback(() => {
    setShowOptionsMenu(prev => !prev);
    setShowAttachMenu(false);
  }, []);

  const toggleWebSearch = useCallback(() => {
    setWebSearchActive(prev => !prev);
    setShowOptionsMenu(false);
    showNotification(
      !webSearchActive ? "Recherche web activée" : "Recherche web désactivée",
      "info",
      2000
    );
  }, [webSearchActive, showNotification]);

  const closeAllMenus = useCallback(() => {
    setShowAttachMenu(false);
    setShowOptionsMenu(false);
    setSidebarOpen(false);
  }, []);

  const getThemeClasses = useCallback(() => ({
    background: darkMode ? "bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900" : "bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50",
    card: darkMode ? "bg-gray-800/90 backdrop-blur-xl border-gray-700/50" : "bg-white/90 backdrop-blur-xl border-white/20",
    text: darkMode ? "text-gray-100" : "text-gray-800",
    textSecondary: darkMode ? "text-gray-300" : "text-gray-600",
    input: darkMode ? "bg-gray-700/50 border-gray-600 text-white placeholder-gray-400" : "bg-white/70 border-gray-200 text-gray-800 placeholder-gray-500",
    sidebar: darkMode ? "bg-gray-900/95" : "bg-white/95",
    button: darkMode ? "hover:bg-gray-700/50 text-gray-300" : "hover:bg-gray-100/50 text-gray-600",
    menu: darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
  }), [darkMode]);

  const getFontSizeClass = useCallback(() => {
    switch(fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  }, [fontSize]);

  const contextValue = {
    user, isAuthenticated, authLoading, handleLogin, handleSignup, handleLogout,
    currentView, setCurrentView, darkMode, setDarkMode, fontSize, setFontSize,
    soundEnabled, setSoundEnabled, messages, setMessages, conversations, setConversations,
    currentConversation, setCurrentConversation, conversationHistory, setConversationHistory,
    isLoading, setIsLoading, connectionStatus, setConnectionStatus, sessionId,
    initializeChat, createNewConversation, sidebarOpen, setSidebarOpen,
    notification, setNotification, showNotification, showAttachMenu, setShowAttachMenu,
    showOptionsMenu, setShowOptionsMenu, pinnedMessages, setPinnedMessages,
    webSearchActive, setWebSearchActive, clearChat, copyMessage, playNotificationSound,
    toggleAttachMenu, toggleOptionsMenu, toggleWebSearch, closeAllMenus,
    getThemeClasses, getFontSizeClass, loadConversation, saveCurrentConversation,
    searchConversations, isSearching, searchResults, exportConversationToPDF,
    updateConversationTags, deleteConversation, toggleFavorite, favoriteConversations,
    speakText, stopSpeaking, isSpeaking, ttsEnabled, setTtsEnabled, ttsVoice, setTtsVoice,
    shareConversation, togglePinMessage, copyToClipboard, syncConversationsFromServer
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export default ChatContext;