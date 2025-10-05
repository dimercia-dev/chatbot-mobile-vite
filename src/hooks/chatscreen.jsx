// components/ChatScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, Bot, User, Loader2, LogOut, CheckCircle, AlertCircle, 
  Settings, Trash2, Copy, Menu, Plus, Globe, Image, Paperclip, 
  FileText, Mic, Camera, Smile,
  SidebarOpen
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import Sidebar from './Sidebar';

const WEBHOOK_URL = "https://n8n-latest-taz3.onrender.com/webhook/mobile-chat";
const API_KEY = "mon-api-key-test-123";

const ChatScreen = () => {
  const {
    user,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    connectionStatus,
    setConnectionStatus,
    sessionId,
    showAttachMenu,
    setShowAttachMenu,
    showOptionsMenu,
    setShowOptionsMenu,
    webSearchActive,
    toggleWebSearch,
    clearChat,
    copyMessage,
    handleLogout,
    setCurrentView,
    getThemeClasses,
    getFontSizeClass,
    showNotification,
    closeAllMenus
  } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const theme = getThemeClasses();
  const fontClass = getFontSizeClass();

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus automatique sur l'input
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, []);

  // Fermer les menus en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      closeAllMenus();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeAllMenus]);

  // Formatage des messages bot
  const formatBotMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>')
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\n/g, '<br>');
  };

  // Envoi de message
const sendMessage = async () => {
  if (!inputMessage.trim() || isLoading) return;

  const userMessage = {
    id: `msg_${Date.now()}`,
    text: inputMessage.trim(),
    sender: "user",
    timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    status: "sending",
  };

  const messageText = inputMessage.trim();
  setMessages(prev => [...prev, userMessage]);
  setInputMessage("");
  setIsLoading(true);
  setConnectionStatus("connecting");

  try {
    console.log("Envoi message vers n8n:", {
      chatInput: messageText,
      sessionId,
      userId: user?.id,
      timestamp: new Date().toISOString(),
      webSearchActive,
    });

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify({
        chatInput: messageText,
        sessionId,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        webSearchActive,
      }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log("Réponse n8n:", data);

    // Mettre à jour le statut du message utilisateur
    setMessages(prev => prev.map(msg =>
      msg.id === userMessage.id ? { ...msg, status: "delivered" } : msg
    ));

    // Récupérer la réponse du bot
    const botResponse = data?.data?.response || data?.response || data?.output || "Désolé, je n'ai pas pu traiter votre demande.";

    const botMessage = {
      id: `msg_${Date.now() + 1}`,
      text: botResponse,
      sender: "bot",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: "delivered",
      formatted: true
    };

    setMessages(prev => [...prev, botMessage]);
    setConnectionStatus("connected");

  } catch (error) {
    console.error("Erreur envoi message:", error);

    const isCorsError = error instanceof TypeError && error.message === "Failed to fetch";
    if (isCorsError) {
      showNotification("Erreur CORS : vérifiez la configuration de votre webhook n8n.", "error");
    } else {
      showNotification("Erreur de connexion. Réessayez plus tard.", "error");
    }

    // Marquer le message comme erreur
    setMessages(prev => prev.map(msg =>
      msg.id === userMessage.id ? { ...msg, status: "error" } : msg
    ));

    setConnectionStatus("error");
  } finally {
    setIsLoading(false);
  }
};


      

  // Gestion des touches
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Gestion des fichiers
  const handleAttachFile = (type) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    switch (type) {
      case 'image':
        input.accept = 'image/*';
        break;
      case 'file':
        input.accept = '*/*';
        break;
      case 'document':
        input.accept = '.pdf,.doc,.docx,.txt';
        break;
      default:
        input.accept = '*/*';
    }

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        showNotification(`Fichier "${file.name}" sélectionné (fonctionnalité à venir)`, 'info');
      }
    };

    input.click();
    setShowAttachMenu(false);
  };

  // Menu des pièces jointes
  const AttachMenu = () => (
    <div className={`absolute bottom-12 left-0 ${theme.menu} rounded-2xl shadow-xl border p-2 min-w-48 z-50 animate-slide-up`}>
      <button
        onClick={() => handleAttachFile('image')}
        className={`w-full p-3 hover:bg-gray-100/20 rounded-xl flex items-center gap-3 ${theme.text} transition-colors`}
      >
        <Image className="w-5 h-5 text-blue-500"/>
        <span>Image</span>
      </button>
      <button
        onClick={() => handleAttachFile('document')}
        className={`w-full p-3 hover:bg-gray-100/20 rounded-xl flex items-center gap-3 ${theme.text} transition-colors`}
      >
        <FileText className="w-5 h-5 text-green-500"/>
        <span>Document</span>
      </button>
      <button
        onClick={() => handleAttachFile('file')}
        className={`w-full p-3 hover:bg-gray-100/20 rounded-xl flex items-center gap-3 ${theme.text} transition-colors`}
      >
        <Paperclip className="w-5 h-5 text-purple-500"/>
        <span>Fichier</span>
      </button>
      <button
        onClick={() => {
          showNotification("Enregistrement vocal à venir", "info");
          setShowAttachMenu(false);
        }}
        className={`w-full p-3 hover:bg-gray-100/20 rounded-xl flex items-center gap-3 ${theme.text} transition-colors`}
      >
        <Mic className="w-5 h-5 text-red-500"/>
        <span>Audio</span>
      </button>
    </div>
  );

  // Menu des options
  const OptionsMenu = () => (
    <div className={`absolute bottom-12 right-0 ${theme.menu} rounded-2xl shadow-xl border p-2 min-w-48 z-50 animate-slide-up`}>
      <button
        onClick={toggleWebSearch}
        className={`w-full p-3 hover:bg-gray-100/20 rounded-xl flex items-center gap-3 ${theme.text} transition-colors ${webSearchActive ? 'bg-blue-100/20' : ''}`}
      >
        <Globe className={`w-5 h-5 ${webSearchActive ? 'text-blue-500' : 'text-gray-500'}`}/>
        <span>Recherche web {webSearchActive ? '(activée)' : ''}</span>
      </button>
      <button
        onClick={() => {
          setCurrentView("settings");
          setShowOptionsMenu(false);
        }}
        className={`w-full p-3 hover:bg-gray-100/20 rounded-xl flex items-center gap-3 ${theme.text} transition-colors`}
      >
        <Settings className="w-5 h-5 text-gray-500"/>
        <span>Paramètres</span>
      </button>
    </div>
  );

  return (
    <>
      <Sidebar />
      
      <div className={`min-h-screen flex flex-col max-w-md mx-auto ${theme.background}`}>
        {/* Header */}
        <div className={`${theme.card} shadow-2xl px-6 py-4 border-b flex justify-between items-center sticky top-0 z-30`}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setShowAttachMenu(true);
                console.log('sidebar open:', SidebarOpen);
              }}
              className={`p-2 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
            >
              <Menu className="w-5 h-5"/>
            </button>
            
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl">
                <Bot className="w-6 h-6 text-white"/>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-md transition-colors ${
                connectionStatus === "connected" ? "bg-green-500" : 
                connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
              }`}></div>
            </div>
            
            <div>
              <h1 className={`font-bold ${theme.text} text-lg`}>Assistant IA</h1>
              <p className={`text-xs font-medium ${
                connectionStatus === "connected" ? "text-green-600" : 
                connectionStatus === "connecting" ? "text-yellow-600" : "text-red-600"
              }`}>
                {connectionStatus === "connected" ? "En ligne" : 
                 connectionStatus === "connecting" ? "Connexion..." : "Hors ligne"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={clearChat} 
              className={`p-2.5 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
              title="Effacer la conversation"
            >
              <Trash2 className="w-4 h-4"/>
            </button>
            <button 
              onClick={() => setCurrentView("settings")} 
              className={`p-2.5 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
              title="Paramètres"
            >
              <Settings className="w-4 h-4"/>
            </button>
            <button 
              onClick={handleLogout} 
              className={`p-2.5 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
              title="Déconnexion"
            >
              <LogOut className="w-5 h-5"/>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {messages.map(msg => (
            <div 
              key={msg.id} 
              className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"} group animate-fade-in`}
            >
              {/* Avatar bot */}
              {msg.sender === "bot" && (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Bot className="w-5 h-5 text-white"/>
                </div>
              )}
              
              <div className="flex flex-col max-w-[80%]">
                {/* Bulle de message */}
                <div className={`px-4 py-3 rounded-3xl shadow-lg transition-all hover:shadow-xl ${
                  msg.sender === "user"
                    ? "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white"
                    : `${theme.card} ${theme.text} border`
                }`}>
                  {msg.formatted && msg.sender === "bot" ? (
                    <div 
                      className={`${fontClass} leading-relaxed prose prose-sm max-w-none`}
                      dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }}
                    />
                  ) : (
                    <p className={`${fontClass} leading-relaxed whitespace-pre-wrap`}>
                      {msg.text}
                    </p>
                  )}
                  
                  {/* Footer du message */}
                  <div className="flex justify-between items-center mt-2">
                    <span className={`text-xs ${msg.sender === "user" ? "text-blue-100" : theme.textSecondary}`}>
                      {msg.timestamp}
                    </span>
                    <div className="flex items-center gap-1">
                      {msg.sender === "user" && (
                        <>
                          {msg.status === "sending" && <Loader2 className="w-3 h-3 animate-spin text-blue-100"/>}
                          {msg.status === "delivered" && <CheckCircle className="w-3 h-3 text-blue-100"/>}
                          {msg.status === "error" && <AlertCircle className="w-3 h-3 text-red-300"/>}
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions du message */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex justify-end">
                  <button
                    onClick={() => copyMessage(msg.text)}
                    className={`p-1 hover:bg-gray-200/20 rounded text-xs ${theme.textSecondary} transition-colors`}
                    title="Copier le message"
                  >
                    <Copy className="w-3 h-3"/>
                  </button>
                </div>
              </div>

              {/* Avatar utilisateur */}
              {msg.sender === "user" && (
                <div className={`w-10 h-10 ${theme.card} rounded-2xl flex items-center justify-center shadow-lg border flex-shrink-0`}>
                  <User className="w-5 h-5 text-gray-600"/>
                </div>
              )}
            </div>
          ))}

          {/* Indicateur de saisie */}
          {isLoading && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white"/>
              </div>
              <div className={`${theme.card} px-4 py-3 rounded-3xl shadow-lg flex items-center gap-3 border`}>
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className={`text-sm ${theme.textSecondary} font-medium`}>
                  Assistant réfléchit...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef}/>
        </div>

        {/* Zone de saisie */}
        <div className={`${theme.card} border-t px-4 py-4 sticky bottom-0`}>
          <div className="flex items-end gap-3">
            {/* Bouton pièces jointes */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachMenu(!showAttachMenu);
                  setShowOptionsMenu(false);
                }}
                className={`p-2 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
                title="Joindre un fichier"
              >
                <Plus className="w-5 h-5"/>
              </button>
              
              {showAttachMenu && <AttachMenu />}
            </div>

            {/* Zone de texte */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                className={`w-full h-12 px-4 pr-12 rounded-2xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${fontClass}`}
                disabled={isLoading}
                maxLength={1000}
              />
              
              {/* Compteur de caractères */}
              {inputMessage.length > 800 && (
                <div className={`absolute bottom-1 right-14 text-xs ${theme.textSecondary} bg-white px-1 rounded`}>
                  {inputMessage.length}/1000
                </div>
              )}

              {/* Bouton emoji (placeholder) */}
              <button
                onClick={() => showNotification("Émojis à venir !", "info")}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${theme.textSecondary} hover:${theme.text} transition-colors`}
                title="Émojis"
              >
                <Smile className="w-5 h-5"/>
              </button>
            </div>

            {/* Bouton options */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptionsMenu(!showOptionsMenu);
                  setShowAttachMenu(false);
                }}
                className={`p-2 rounded-xl transition ${
                  webSearchActive 
                    ? 'bg-blue-500 text-white' 
                    : `${theme.textSecondary} hover:bg-gray-200/20`
                }`}
                title="Options"
              >
                <Globe className="w-5 h-5"/>
              </button>
              
              {showOptionsMenu && <OptionsMenu />}
            </div>

            {/* Bouton d'envoi */}
            <button 
              onClick={sendMessage} 
              disabled={!inputMessage.trim() || isLoading} 
              className="w-12 h-12 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center disabled:opacity-50 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 disabled:transform-none"
              title="Envoyer le message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin"/>
              ) : (
                <Send className="w-5 h-5 text-white"/>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatScreen;