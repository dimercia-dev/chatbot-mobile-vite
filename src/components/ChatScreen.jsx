// components/ChatScreen.jsx
import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, Bot, Loader2, LogOut, CheckCircle, AlertCircle, 
  Settings, Trash2, Copy, Menu, Plus, Globe, Image, Paperclip, 
  FileText, Mic, Smile
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import Sidebar from './Sidebar';

const WEBHOOK_URL = "https://n8n-latest-taz3.onrender.com/webhook-test/mobile-chat";
const API_KEY = "UdOJQviEWrGINh0U3LcrNm0RyQ8KkPsz75mpttUp6XU=";

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
    setSidebarOpen,
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
    showNotification,
    closeAllMenus
  } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const theme = getThemeClasses();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (e.target.closest('.sidebar') || e.target.closest('.menu-button')) return;
      closeAllMenus();
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeAllMenus]);

  const formatBotMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="text-xl font-bold mt-3 mb-2">$1</h1>')
      .replace(/\n/g, '<br>');
  };

  const extractSuggestedQuestions = (text) => {
    const regex = /(?:Questions?|Suggestions?)[\s:]*\n([^\n]+(?:\n[^\n]+)*)/gi;
    const matches = [...text.matchAll(regex)];
    
    if (matches.length === 0) return [];
    
    const questions = matches[0][1]
      .split('\n')
      .map(q => q.trim())
      .filter(q => q.length > 0 && (q.startsWith('-') || q.startsWith('•') || q.match(/^\d+\./)))
      .map(q => q.replace(/^[-•\d.]\s*/, '').trim())
      .filter(q => q.length > 10);
    
    return questions.slice(0, 3);
  };

  const handleSuggestedQuestion = (question) => {
    setInputMessage(question);
    inputRef.current?.focus();
  };

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
    setMessages(prev => [...prev.filter(msg => !msg.isWelcome), userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setConnectionStatus("connecting");

    try {
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

      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: "delivered" } : msg
      ));

      const botResponse = data?.data?.response || data?.response || data?.output || "Désolé, je n'ai pas pu traiter votre demande.";
      const suggestedQuestions = extractSuggestedQuestions(botResponse);

      const botMessage = {
        id: `msg_${Date.now() + 1}`,
        text: botResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: "delivered",
        formatted: true,
        suggestedQuestions
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

      setMessages(prev => prev.map(msg =>
        msg.id === userMessage.id ? { ...msg, status: "error" } : msg
      ));

      setConnectionStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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

  const AttachMenu = () => (
    <div className={`absolute bottom-14 left-0 ${theme.menu} rounded-xl shadow-2xl border p-1.5 min-w-44 z-50 animate-slide-up`}>
      <button
        onClick={() => handleAttachFile('image')}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Image className="w-4 h-4 text-blue-500"/>
        <span>Image</span>
      </button>
      <button
        onClick={() => handleAttachFile('document')}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <FileText className="w-4 h-4 text-green-500"/>
        <span>Document</span>
      </button>
      <button
        onClick={() => handleAttachFile('file')}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Paperclip className="w-4 h-4 text-purple-500"/>
        <span>Fichier</span>
      </button>
      <button
        onClick={() => {
          showNotification("Enregistrement vocal à venir", "info");
          setShowAttachMenu(false);
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Mic className="w-4 h-4 text-red-500"/>
        <span>Audio</span>
      </button>
    </div>
  );

  const OptionsMenu = () => (
    <div className={`absolute bottom-14 right-0 ${theme.menu} rounded-xl shadow-2xl border p-1.5 min-w-44 z-50 animate-slide-up`}>
      <button
        onClick={toggleWebSearch}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm ${webSearchActive ? 'bg-blue-100/20' : ''}`}
      >
        <Globe className={`w-4 h-4 ${webSearchActive ? 'text-blue-500' : 'text-gray-500'}`}/>
        <span>Recherche web {webSearchActive ? '✓' : ''}</span>
      </button>
      <button
        onClick={() => {
          setCurrentView("settings");
          setShowOptionsMenu(false);
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Settings className="w-4 h-4 text-gray-500"/>
        <span>Paramètres</span>
      </button>
    </div>
  );

  const displayMessages = messages.filter((msg, index) => {
    if (msg.isWelcome && messages.length > 1) {
      return false;
    }
    return true;
  });

  return (
    <>
      <Sidebar />
      
      <div className={`h-screen flex flex-col max-w-md mx-auto ${theme.background}`}>
        {/* Header - Position fixe */}
        <div className={`${theme.card} shadow-lg px-4 py-3 border-b flex justify-between items-center shrink-0`}>
          <div className="flex items-center gap-3">
            <button
                onClick={(e) =>{ 
                  e.stopPropagation();
                  setSidebarOpen(true)
                }}
                className={`p-1.5 hover:bg-gray-200/20 rounded-lg transition ${theme.textSecondary}`}
                >
                <Menu className="w-5 h-5"/>
            </button>
            
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white"/>
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${theme.card} shadow-sm transition-colors ${
                connectionStatus === "connected" ? "bg-green-500" : 
                connectionStatus === "connecting" ? "bg-yellow-500" : "bg-red-500"
              }`}></div>
            </div>
            
            <div>
              <h1 className={`font-semibold ${theme.text} text-base`}>Assistant IA</h1>
              <p className={`text-xs ${
                connectionStatus === "connected" ? "text-green-600" : 
                connectionStatus === "connecting" ? "text-yellow-600" : "text-red-600"
              }`}>
                {connectionStatus === "connected" ? "En ligne" : 
                 connectionStatus === "connecting" ? "Connexion..." : "Hors ligne"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={clearChat} 
              className={`p-2 hover:bg-gray-200/20 rounded-lg transition ${theme.textSecondary}`}
              title="Effacer"
            >
              <Trash2 className="w-4 h-4"/>
            </button>
            <button 
              onClick={() => setCurrentView("settings")} 
              className={`p-2 hover:bg-gray-200/20 rounded-lg transition ${theme.textSecondary}`}
              title="Paramètres"
            >
              <Settings className="w-4 h-4"/>
            </button>
            <button 
              onClick={handleLogout} 
              className={`p-2 hover:bg-gray-200/20 rounded-lg transition ${theme.textSecondary}`}
              title="Déconnexion"
            >
              <LogOut className="w-4.5 h-4.5"/>
            </button>
          </div>
        </div>

        {/* Messages - Zone scrollable */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2"
          style={{ 
            backgroundImage: darkMode ? 'none' : 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 30 L35 25 L30 20\' stroke=\'%23e5e7eb\' stroke-width=\'0.5\' fill=\'none\'/%3E%3C/svg%3E")',
            backgroundColor: darkMode ? '#0c1317' : '#efeae2'
          }}
        >
          <div className="space-y-1.5">
            {displayMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} group`}
              >
                <div className={`max-w-[85%] ${msg.sender === "user" ? "max-w-[75%]" : ""}`}>
                  <div className={`px-3 py-2 rounded-lg shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#dcf8c6] text-gray-800 rounded-br-none"
                      : `${darkMode ? 'bg-[#1f2c34]' : 'bg-white'} ${theme.text} rounded-bl-none`
                  }`}>
                    {msg.formatted && msg.sender === "bot" ? (
                      <div 
                        className="text-[15px] leading-relaxed font-['Segoe_UI',_Roboto,_Helvetica,_Arial,_sans-serif] [&_strong]:font-semibold [&_em]:italic [&_code]:bg-gray-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
                        dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }}
                      />
                    ) : (
                      <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-['Segoe_UI',_Roboto,_Helvetica,_Arial,_sans-serif]">
                        {msg.text}
                      </p>
                    )}
                    
                    <div className="flex justify-end items-center mt-1 gap-1">
                      <span className={`text-[11px] ${msg.sender === "user" ? "text-gray-600" : theme.textSecondary}`}>
                        {msg.timestamp}
                      </span>
                      {msg.sender === "user" && (
                        <>
                          {msg.status === "sending" && <Loader2 className="w-3 h-3 animate-spin text-gray-500"/>}
                          {msg.status === "delivered" && <CheckCircle className="w-3 h-3 text-blue-500"/>}
                          {msg.status === "error" && <AlertCircle className="w-3 h-3 text-red-500"/>}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Suggestions de questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuestion(question)}
                          className={`block w-full text-left px-3 py-2 rounded-lg text-sm ${
                            darkMode ? 'bg-[#1f2c34] hover:bg-[#2a3942]' : 'bg-white hover:bg-gray-50'
                          } ${theme.text} border ${darkMode ? 'border-gray-700' : 'border-gray-200'} transition-colors shadow-sm`}
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {/* Bouton copier */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    <button
                      onClick={() => copyMessage(msg.text)}
                      className={`p-1 hover:bg-gray-200/20 rounded text-xs ${theme.textSecondary} transition-colors`}
                      title="Copier"
                    >
                      <Copy className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Indicateur de saisie */}
            {isLoading && (
              <div className="flex justify-start">
                <div className={`${darkMode ? 'bg-[#1f2c34]' : 'bg-white'} px-4 py-3 rounded-lg shadow-sm flex items-center gap-2`}>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>
        </div>

        {/* Zone de saisie - Position fixe */}
        <div className={`${theme.card} border-t px-2 py-2 shrink-0`}>
          <div className="flex items-end gap-1.5">
            {/* Bouton pièces jointes */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachMenu(!showAttachMenu);
                  setShowOptionsMenu(false);
                }}
                className={`p-2 hover:bg-gray-200/20 rounded-full transition ${theme.textSecondary}`}
                title="Joindre"
              >
                <Plus className="w-5 h-5"/>
              </button>
              
              {showAttachMenu && <AttachMenu />}
            </div>

            {/* Zone de texte - Textarea multi-lignes */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message"
                className={`w-full min-h-[40px] max-h-[120px] px-3 py-2.5 rounded-[20px] border resize-none ${theme.input} focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-[15px] font-['Segoe_UI',_Roboto,_Helvetica,_Arial,_sans-serif]`}
                disabled={isLoading}
                maxLength={1000}
                spellCheck="true"
                lang="fr"
                rows="1"
                style={{ 
                  lineHeight: '20px',
                  overflowY: inputMessage.split('\n').length > 3 ? 'auto' : 'hidden'
                }}
              />
              
              {/* Emoji button */}
              <button
                onClick={() => showNotification("Émojis à venir !", "info")}
                className={`absolute right-3 bottom-3 ${theme.textSecondary} hover:${theme.text} transition-colors`}
                title="Émojis"
              >
                <Smile className="w-5 h-5"/>
              </button>
            </div>

            {/* Bouton options ou envoi */}
            {inputMessage.trim() ? (
              <button 
                onClick={sendMessage} 
                disabled={isLoading} 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none"
                title="Envoyer"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin"/>
                ) : (
                  <Send className="w-5 h-5 text-white"/>
                )}
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(!showOptionsMenu);
                    setShowAttachMenu(false);
                  }}
                  className={`p-2 rounded-full transition ${
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
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatScreen;