// src/context/ChatContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authApi from '../services/authApi';

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState("login");
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
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [conversationHistory, setConversationHistory] = useState(() => {
    const saved = localStorage.getItem('conversationHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [sessionId] = useState(() => `session_${Math.random().toString(36).substr(2, 9)}`);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [webSearchActive, setWebSearchActive] = useState(false);

  // Sauvegarder l'historique des conversations
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
    }
  }, [conversationHistory]);

  // Charger la session existante
  useEffect(() => {
    const checkExistingSession = async () => {
      setAuthLoading(true);
      try {
        const existingUser = await authApi.checkExistingSession();
        if (existingUser) {
          setUser(existingUser);
          setIsAuthenticated(true);
          setCurrentView("chat");
          
          // Charger la dernière conversation active
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

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('soundEnabled', JSON.stringify(soundEnabled));
  }, [soundEnabled]);

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

  const initializeChat = useCallback(async (userName = null) => {
    const name = userName || user?.nom || "utilisateur";
    const welcomeMessage = {
      id: `msg_${Date.now()}`,
      text: `Bonjour ${name} ! Je suis votre assistant IA. Comment puis-je vous aider aujourd'hui ?`,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: "delivered",
      formatted: true,
      isWelcome: true // Marqueur pour identifier le message de bienvenue
    };
    setMessages([welcomeMessage]);
    setConnectionStatus("connected");
  }, [user]);

  const saveCurrentConversation = useCallback(() => {
    if (currentConversation && messages.length > 1) { // Plus d'un message (pas juste le welcome)
      const convToSave = {
        id: currentConversation,
        title: messages[1]?.text?.substring(0, 50) + '...' || "Nouvelle conversation",
        messages: messages.filter(msg => !msg.isWelcome), // Exclure le message de bienvenue
        createdAt: new Date(),
        lastMessage: messages[messages.length - 1]?.text
      };
      
      setConversationHistory(prev => {
        const filtered = prev.filter(c => c.id !== currentConversation);
        return [convToSave, ...filtered].slice(0, 50); // Garder max 50 conversations
      });
      
      localStorage.setItem('currentConversationId', currentConversation);
    }
  }, [currentConversation, messages]);

  // Sauvegarder automatiquement la conversation à chaque nouveau message
  useEffect(() => {
    if (messages.length > 1) {
      const timeoutId = setTimeout(() => {
        saveCurrentConversation();
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, saveCurrentConversation]);

  const loadConversation = useCallback((conversationId) => {
    const conv = conversationHistory.find(c => c.id === conversationId);
    if (conv) {
      setCurrentConversation(conversationId);
      setMessages(conv.messages || []);
      setCurrentView("chat");
      setSidebarOpen(false);
      localStorage.setItem('currentConversationId', conversationId);
      showNotification("Conversation chargée", "success", 2000);
    }
  }, [conversationHistory, showNotification]);

  const createNewConversation = useCallback(() => {
    // Sauvegarder la conversation actuelle avant d'en créer une nouvelle
    saveCurrentConversation();
    
    const newConvId = `conv_${Date.now()}`;
    setCurrentConversation(newConvId);
    setMessages([]);
    setSidebarOpen(false);
    
    if (user) {
      initializeChat(user.nom);
    } else {
      initializeChat();
    }
    
    localStorage.setItem('currentConversationId', newConvId);
  }, [saveCurrentConversation, user, initializeChat]);

  const handleLogin = useCallback(async (credentials) => {
  setAuthLoading(true);
  try {
    const response = await authApi.login(credentials);
    setUser(response.data.user);
    setIsAuthenticated(true);
    setCurrentView("chat"); // ← Vérifiez cette ligne
    
    const newConvId = `conv_${Date.now()}`;
    setCurrentConversation(newConvId);
    
    await initializeChat(response.data.user.nom);
    showNotification(`Bienvenue ${response.data.user.nom} !`, "success");
    return { success: true };
  } catch (error) {
    showNotification(error.message, "error");
    return { success: false, error: error.message };
  } finally {
    setAuthLoading(false);
  }
}, [initializeChat, showNotification]);

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
    // Sauvegarder avant de déconnecter
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
    navigator.clipboard.writeText(text).then(() => {
      showNotification("Message copié !", "success", 2000);
    }).catch(() => {
      showNotification("Erreur copie", "error", 2000);
    });
  }, [showNotification]);

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
  }, []);

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
    getThemeClasses, getFontSizeClass, loadConversation, saveCurrentConversation
  };

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
};

export default ChatContext;