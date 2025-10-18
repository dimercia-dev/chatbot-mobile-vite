// components/ChatScreen.jsx - VERSION FINALE COMPLETE
import React, { useRef, useEffect, useState } from 'react';
import { 
  Send, Bot, Loader2, LogOut, CheckCircle, AlertCircle, 
  Settings, Trash2, Copy, Menu, Plus, Globe, Image, Paperclip, 
  FileText, Mic, Smile, X, Play, Pause
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import Sidebar from './Sidebar';
import EmojiPicker from 'emoji-picker-react';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const audioRef = useRef(new Audio());
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
      setShowEmojiPicker(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [closeAllMenus]);

  const formatBotMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-gray-200 dark:bg-gray-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/### (.*?)(\n|$)/g, '<h3 class="text-sm font-semibold mt-2 mb-1">$1</h3>')
      .replace(/## (.*?)(\n|$)/g, '<h2 class="text-base font-semibold mt-2 mb-1">$1</h2>')
      .replace(/# (.*?)(\n|$)/g, '<h1 class="text-base font-bold mt-2 mb-1">$1</h1>')
      .replace(/^- (.*?)$/gm, '<li class="ml-4">• $1</li>')
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  };

  const toggleAudioPlay = (audioBase64, msgId) => {
    if (playingAudio === msgId) {
      audioRef.current.pause();
      setPlayingAudio(null);
    } else {
      audioRef.current.src = audioBase64;
      audioRef.current.play();
      setPlayingAudio(msgId);
      
      audioRef.current.onended = () => setPlayingAudio(null);
    }
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

const handleAttachFile = async (type) => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept =
    type === 'image'
      ? 'image/*'
      : type === 'document'
      ? '.pdf,.doc,.docx,.txt'
      : '*/*';

  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showNotification("Fichier trop volumineux (max 5MB)", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPendingFile({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: reader.result,
        preview: file.type.startsWith('image/') ? reader.result : null,
      });
    };
    reader.readAsDataURL(file);
  };

  input.click();
  setShowAttachMenu(false);
};


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        reader.onloadend = () => {
          const base64 = reader.result;
          const audioMessage = {
            id: `msg_${Date.now()}`,
            text: "Message vocal",
            sender: "user",
            timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            status: "preview", // Changé de "sending" à "preview"
            fileData: {
              name: `audio_${Date.now()}.webm`,
              type: 'audio/webm',
              size: audioBlob.size,
              base64: base64,
              isAudio: true
            }
          };
          
          setMessages(prev => [...prev, audioMessage]);
          showNotification("Audio enregistré. Cliquez sur Envoyer.", "success");
          // NE PAS appeler sendMessageWithFile ici
        };
        
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      showNotification("Enregistrement en cours...", "info");
    } catch (error) {
      showNotification("Erreur d'accès au microphone", "error");
      console.error(error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      showNotification("Enregistrement terminé", "success");
    }
  };

  const sendMessageWithFile = async (fileMessage) => {
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
          chatInput: fileMessage.caption || fileMessage.text || "Analyse ce fichier",
          sessionId,
          userId: user?.id,
          timestamp: new Date().toISOString(),
          webSearchActive,
          fileData: fileMessage.fileData
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}`);
      }

      const data = await response.json();

      setMessages(prev => prev.map(msg =>
        msg.id === fileMessage.id ? { ...msg, status: "delivered" } : msg
      ));

      const botResponse = data?.data?.response || "Désolé, je n'ai pas pu traiter votre demande.";
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
      setInputMessage("");

    } catch (error) {
      console.error("Erreur envoi:", error);
      showNotification("Erreur d'envoi du fichier", "error");
      
      setMessages(prev => prev.map(msg =>
        msg.id === fileMessage.id ? { ...msg, status: "error" } : msg
      ));

      setConnectionStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !messages.some(m => m.status === "preview")) || isLoading) return;

    const fileInPreview = messages.find(m => m.status === "preview");
    
    if (fileInPreview) {
      // Mettre à jour le fichier avec la légende de l'input
      const updatedFileMessage = {
        ...fileInPreview,
        caption: inputMessage.trim(), // Capturer la légende ici
        status: "sending"
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === fileInPreview.id ? updatedFileMessage : msg
      ));
      
      setInputMessage(""); // Effacer l'input APRÈS avoir capturé la légende
      sendMessageWithFile(updatedFileMessage);
      return;
    }

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

      const botResponse = data?.data?.response || "Désolé, je n'ai pas pu traiter votre demande.";
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
      console.error("Erreur envoi:", error);
      showNotification("Erreur de connexion", "error");
      
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

  const onEmojiClick = (emojiObject) => {
    setInputMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
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
        onClick={isRecording ? stopRecording : startRecording}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm ${isRecording ? 'bg-red-100' : ''}`}
      >
        <Mic className={`w-4 h-4 ${isRecording ? 'text-red-600 animate-pulse' : 'text-red-500'}`}/>
        <span>{isRecording ? 'Arrêter' : 'Audio'}</span>
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

  const displayMessages = messages.filter((msg) => {
    if (msg.isWelcome && messages.length > 1) {
      return false;
    }
    return true;
  });

  return (
    <>
    {pendingFile && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 w-11/12 max-w-sm shadow-2xl relative">
      <button
        onClick={() => setPendingFile(null)}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
      >
        <X className="w-4 h-4" />
      </button>

      {pendingFile.preview ? (
        <img
          src={pendingFile.preview}
          alt={pendingFile.name}
          className="w-full max-h-80 object-contain rounded-lg mb-3"
        />
      ) : (
        <div className="flex items-center gap-2 p-3 border rounded-lg bg-gray-100 dark:bg-gray-700 mb-3">
          <FileText className="text-blue-500 w-5 h-5" />
          <div>
            <p className="text-sm font-medium">{pendingFile.name}</p>
            <p className="text-xs text-gray-500">
              {(pendingFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        </div>
      )}

      <textarea
        value={inputMessage}
        onChange={(e) => setInputMessage(e.target.value)}
        placeholder="Ajouter une légende..."
        className="w-full border rounded-lg p-2 mb-3 text-sm focus:ring focus:ring-blue-500"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => setPendingFile(null)}
          className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-100"
        >
          Annuler
        </button>
        <button
          onClick={() => {
            const fileMessage = {
              id: `msg_${Date.now()}`,
              text: pendingFile.name,
              caption: inputMessage.trim(),
              sender: "user",
              timestamp: new Date().toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
              status: "sending",
              fileData: pendingFile,
            };
            setMessages((prev) => [...prev, fileMessage]);
            setPendingFile(null);
            setInputMessage("");
            sendMessageWithFile(fileMessage);
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Envoyer
        </button>
      </div>
    </div>
  </div>
)}

      <Sidebar />
      
      <div className={`h-screen flex flex-col max-w-md mx-auto ${theme.background}`}>
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

        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2 bg-[#efeae2]"
        >
          <div className="space-y-1">
            {displayMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} group`}
              >
                <div className={`max-w-[85%] ${msg.sender === "user" ? "max-w-[75%]" : ""}`}>
                  <div className={`px-3 py-2 rounded-lg shadow-sm ${
                    msg.sender === "user"
                      ? "bg-[#dcf8c6] text-gray-800 rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  }`}>
                    {msg.fileData?.preview && (
                      <div className="mb-2 relative">
                        <img 
                          src={msg.fileData.preview} 
                          alt={msg.fileData.name}
                          className="max-w-full rounded-lg"
                          style={{ maxHeight: '300px' }}
                        />
                        {msg.status === "preview" && (
                          <button
                            onClick={() => setMessages(prev => prev.filter(m => m.id !== msg.id))}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg"
                          >
                            <X className="w-4 h-4"/>
                          </button>
                        )}
                      </div>
                    )}

                    {msg.fileData?.isAudio && (
                      <div className="flex items-center gap-2 mb-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                        <button
                          onClick={() => toggleAudioPlay(msg.fileData.base64, msg.id)}
                          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                        >
                          {playingAudio === msg.id ? (
                            <Pause className="w-4 h-4"/>
                          ) : (
                            <Play className="w-4 h-4"/>
                          )}
                        </button>
                        <Mic className="w-4 h-4 text-gray-600"/>
                        <span className="text-xs text-gray-600">
                          {(msg.fileData.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}


                    {msg.caption && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{msg.caption}</p>
                    )}
                    
                    {msg.formatted && msg.sender === "bot" ? (
                      <div 
                        className="text-[15px] leading-[1.4] [&_strong]:font-semibold [&_h1]:text-base [&_h1]:font-bold [&_h1]:mt-2 [&_h1]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-1 [&_h3]:mb-0.5"
                        dangerouslySetInnerHTML={{ __html: formatBotMessage(msg.text) }}
                      />
                    ) : (
                      !msg.fileData && <p className="text-[15px] leading-[1.4] whitespace-pre-wrap">{msg.text}</p>
                    )}
                    
                    <div className="flex justify-end items-center mt-1 gap-1">
                      <span className={`text-[11px] ${msg.sender === "user" ? "text-gray-600" : "text-gray-500"}`}>
                        {msg.timestamp}
                      </span>
                      {msg.sender === "user" && (
                        <>
                          {msg.status === "sending" && <Loader2 className="w-3 h-3 animate-spin text-gray-500"/>}
                          {msg.status === "delivered" && <CheckCircle className="w-3 h-3 text-blue-500"/>}
                          {msg.status === "error" && <AlertCircle className="w-3 h-3 text-red-500"/>}
                          {msg.status === "preview" && <AlertCircle className="w-3 h-3 text-orange-500"/>}
                        </>
                      )}
                    </div>
                  </div>
                  
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {msg.suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestedQuestion(question)}
                          className="block w-full text-left px-3 py-2 rounded-lg text-sm bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 transition-colors shadow-sm"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-0.5">
                    <button
                      onClick={() => copyMessage(msg.text)}
                      className={`p-1 hover:bg-gray-200/20 rounded text-xs ${theme.textSecondary} transition-colors`}
                    >
                      <Copy className="w-3 h-3"/>
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-lg shadow-sm flex items-center gap-2">
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

        <div className={`${theme.card} border-t px-2 py-2 shrink-0`}>
          <div className="flex items-end gap-1.5">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowAttachMenu(!showAttachMenu);
                  setShowOptionsMenu(false);
                  setShowEmojiPicker(false);
                }}
                className={`p-2 hover:bg-gray-200/20 rounded-full transition ${theme.textSecondary} ${isRecording ? 'animate-pulse bg-red-100' : ''}`}
              >
                {isRecording ? <Mic className="w-5 h-5 text-red-600"/> : <Plus className="w-5 h-5"/>}
              </button>
              
              {showAttachMenu && <AttachMenu />}
            </div>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message"
                className={`w-full min-h-[40px] max-h-[120px] px-3 py-2.5 pr-10 rounded-[20px] border resize-none ${theme.input} focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-[15px]`}
                disabled={isLoading || isRecording}
                maxLength={1000}
                spellCheck="true"
                lang="fr"
                rows="1"
                style={{ 
                  lineHeight: '20px',
                  overflowY: inputMessage.split('\n').length > 3 ? 'auto' : 'hidden'
                }}
              />
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowAttachMenu(false);
                  setShowOptionsMenu(false);
                }}
                className={`absolute right-3 bottom-3 ${theme.textSecondary} hover:${theme.text} transition-colors`}
              >
                <Smile className="w-5 h-5"/>
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-14 right-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} height={350} width={300} />
                </div>
              )}
            </div>

            {inputMessage.trim() || messages.some(m => m.status === "preview") ? (
              <button 
                onClick={sendMessage} 
                disabled={isLoading || isRecording} 
                className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none"
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
                    setShowEmojiPicker(false);
                  }}
                  className={`p-2 rounded-full transition ${
                    webSearchActive 
                      ? 'bg-blue-500 text-white' 
                      : `${theme.textSecondary} hover:bg-gray-200/20`
                  }`}
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