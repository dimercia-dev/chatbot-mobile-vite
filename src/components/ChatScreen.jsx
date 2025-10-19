// components/ChatScreen.jsx - VERSION COMPLETE AVEC GESTION DES QUESTIONS SUGGEREES
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Send, Bot, Loader2, LogOut, CheckCircle, AlertCircle, 
  Settings, Trash2, Copy, Menu, Plus, Globe, Image, Paperclip, 
  FileText, Mic, Smile, X, Play, Pause, Volume2, VolumeX,
  Star, Share2, Pin, Tag, Download, Search
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';
import Sidebar from './Sidebar';
import EmojiPicker from 'emoji-picker-react';

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || "https://n8n-latest-taz3.onrender.com/webhook-test/mobile-chat";
const API_KEY = import.meta.env.VITE_API_KEY || "UdOJQviEWrGINh0U3LcrNm0RyQ8KkPsz75mpttUp6XU=";

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
    closeAllMenus,
    currentConversation,
    togglePinMessage,
    pinnedMessages,
    toggleFavorite,
    favoriteConversations,
    speakText,
    stopSpeaking,
    isSpeaking,
    ttsEnabled,
    setTtsEnabled,
    shareConversation,
    exportConversationToPDF,
    updateConversationTags
  } = useChatContext();

  const [inputMessage, setInputMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [conversationTags, setConversationTags] = useState([]);
  const [showActionsMenu, setShowActionsMenu] = useState(null);
  
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
      // Ne pas fermer si on clique sur une question suggérée
      if (e.target.closest('.suggested-question')) {
        return;
      }
      
      if (e.target.closest('.sidebar') || e.target.closest('.menu-button')) return;
      closeAllMenus();
      setShowEmojiPicker(false);
      setShowActionsMenu(null);
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

  // Fonction améliorée pour extraire les questions suggérées
  const extractSuggestedQuestions = (text) => {
    // Séparer le contenu principal des questions suggérées
    const sections = text.split('---');
    
    if (sections.length > 1) {
      // Chercher la section "Pour aller plus loin" ou "Questions suggérées"
      const questionSection = sections.find(section => 
        section.includes('Pour aller plus loin') || 
        section.includes('Questions suggérées') ||
        section.includes('Questions possibles')
      );
      
      if (questionSection) {
        // Extraire les lignes qui commencent par "- "
        const questions = questionSection
          .split('\n')
          .filter(line => line.trim().startsWith('- '))
          .map(line => line.trim().replace(/^-\s*/, '').replace(/\[|\]/g, ''))
          .filter(q => q.length > 10);
        
        console.log('Questions extraites:', questions);
        return questions.slice(0, 3);
      }
    }
    
    // Fallback : chercher dans tout le texte
    const allLines = text.split('\n');
    const questions = allLines
      .filter(line => line.trim().startsWith('- ') && line.includes('?'))
      .map(line => line.trim().replace(/^-\s*/, '').replace(/\[|\]/g, ''))
      .filter(q => q.length > 10);
    
    console.log('Questions fallback:', questions);
    return questions.slice(-3); // Prendre les 3 dernières
  };
  
  // Fonction optimisée pour gérer les questions suggérées
  const handleSuggestedQuestion = useCallback((question) => {
    console.log('Question cliquée:', question);
    
    // Étape 1 : Mettre à jour l'état
    setInputMessage(question);
    
    // Étape 2 : Forcer la mise à jour du DOM
    if (inputRef.current) {
      inputRef.current.value = question;
      inputRef.current.focus();
      
      // Placer le curseur à la fin
      const length = question.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, []);

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
            status: "preview",
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
          sendMessageWithFile(audioMessage);
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
          chatInput: fileMessage.caption || fileMessage.text,
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
      
      // Extraire les questions AVANT de nettoyer le texte
      const suggestedQuestions = extractSuggestedQuestions(botResponse);
      
      // Nettoyer le texte principal (enlever la section des questions)
      const mainResponseText = botResponse.split('---')[0].trim();

      const botMessage = {
        id: `msg_${Date.now() + 1}`,
        text: mainResponseText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: "delivered",
        formatted: true,
        suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined
      };

      setMessages(prev => [...prev, botMessage]);
      setConnectionStatus("connected");

    } catch (error) {
      console.error("Erreur envoi:", error);
      showNotification("Erreur de connexion", "error");
      
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
      const updatedFileMessage = {
        ...fileInPreview,
        caption: inputMessage.trim(),
        status: "sending"
      };
      
      setMessages(prev => prev.map(msg => 
        msg.id === fileInPreview.id ? updatedFileMessage : msg
      ));
      
      setInputMessage("");
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
      
      // Extraire les questions AVANT de nettoyer le texte
      const suggestedQuestions = extractSuggestedQuestions(botResponse);
      
      // Nettoyer le texte principal (enlever la section des questions)
      const mainResponseText = botResponse.split('---')[0].trim();

      const botMessage = {
        id: `msg_${Date.now() + 1}`,
        text: mainResponseText,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        status: "delivered",
        formatted: true,
        suggestedQuestions: suggestedQuestions.length > 0 ? suggestedQuestions : undefined
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

  const handleAddTag = () => {
    if (tagInput.trim() && !conversationTags.includes(tagInput.trim())) {
      const newTags = [...conversationTags, tagInput.trim()];
      setConversationTags(newTags);
      updateConversationTags(currentConversation, newTags);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    const newTags = conversationTags.filter(t => t !== tagToRemove);
    setConversationTags(newTags);
    updateConversationTags(currentConversation, newTags);
  };

  const MessageActionsMenu = ({ message }) => (
    <div className={`absolute right-0 top-8 ${theme.menu} rounded-lg shadow-xl border p-1 min-w-40 z-50 animate-slide-up`}>
      <button
        onClick={() => {
          copyMessage(message.text);
          setShowActionsMenu(null);
        }}
        className={`w-full p-2 hover:bg-gray-100/20 rounded flex items-center gap-2 ${theme.text} text-sm`}
      >
        <Copy className="w-4 h-4"/>
        <span>Copier</span>
      </button>
      
      {message.sender === 'bot' && (
        <button
          onClick={() => {
            speakText(message.text);
            setShowActionsMenu(null);
          }}
          className={`w-full p-2 hover:bg-gray-100/20 rounded flex items-center gap-2 ${theme.text} text-sm`}
        >
          {isSpeaking ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
          <span>{isSpeaking ? 'Arrêter' : 'Lire'}</span>
        </button>
      )}
      
      <button
        onClick={() => {
          togglePinMessage(message.id);
          setShowActionsMenu(null);
        }}
        className={`w-full p-2 hover:bg-gray-100/20 rounded flex items-center gap-2 ${theme.text} text-sm ${
          pinnedMessages.includes(message.id) ? 'bg-yellow-100/20' : ''
        }`}
      >
        <Pin className="w-4 h-4"/>
        <span>{pinnedMessages.includes(message.id) ? 'Désépingler' : 'Épingler'}</span>
      </button>
    </div>
  );

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
          setTtsEnabled(!ttsEnabled);
          setShowOptionsMenu(false);
          showNotification(
            !ttsEnabled ? "Synthèse vocale activée" : "Synthèse vocale désactivée",
            "info",
            2000
          );
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm ${ttsEnabled ? 'bg-blue-100/20' : ''}`}
      >
        <Volume2 className={`w-4 h-4 ${ttsEnabled ? 'text-blue-500' : 'text-gray-500'}`}/>
        <span>Synthèse vocale {ttsEnabled ? '✓' : ''}</span>
      </button>
      
      <button
        onClick={() => {
          toggleFavorite(currentConversation);
          setShowOptionsMenu(false);
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm ${
          favoriteConversations.includes(currentConversation) ? 'bg-yellow-100/20' : ''
        }`}
      >
        <Star className={`w-4 h-4 ${favoriteConversations.includes(currentConversation) ? 'text-yellow-500' : 'text-gray-500'}`}/>
        <span>Favoris {favoriteConversations.includes(currentConversation) ? '✓' : ''}</span>
      </button>
      
      <button
        onClick={() => {
          setShowTagModal(true);
          setShowOptionsMenu(false);
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Tag className="w-4 h-4 text-purple-500"/>
        <span>Tags</span>
      </button>
      
      <button
        onClick={() => {
          shareConversation(currentConversation);
          setShowOptionsMenu(false);
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Share2 className="w-4 h-4 text-green-500"/>
        <span>Partager</span>
      </button>
      
      <button
        onClick={() => {
          exportConversationToPDF(currentConversation);
          setShowOptionsMenu(false);
        }}
        className={`w-full p-2.5 hover:bg-gray-100/20 rounded-lg flex items-center gap-2.5 ${theme.text} transition-colors text-sm`}
      >
        <Download className="w-4 h-4 text-indigo-500"/>
        <span>Export PDF</span>
      </button>
      
      <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
      
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

  const hasNoMessages = !messages || messages.length === 0;

  return (
    <>
      {/* Modal de prévisualisation des fichiers */}
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

      {/* Modal des tags */}
      {showTagModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 w-11/12 max-w-sm shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Gérer les tags</h3>
              <button
                onClick={() => setShowTagModal(false)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Nouveau tag..."
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleAddTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ajouter
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {conversationTags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-sm"
                >
                  {tag}
                  <button
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
              ))}
            </div>

            {conversationTags.length === 0 && (
              <p className="text-center text-gray-500 text-sm py-4">
                Aucun tag. Ajoutez-en pour organiser vos conversations.
              </p>
            )}
          </div>
        </div>
      )}

      <Sidebar />
      
      <div className={`h-screen flex flex-col max-w-md mx-auto ${theme.background}`}>
        {/* En-tête */}
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

        {/* Zone des messages */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 py-2 bg-[#efeae2]"
        >
          {/* Message d'accueil si pas de messages */}
          {hasNoMessages && (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-xl">
                <Bot className="w-10 h-10 text-white"/>
              </div>
              <h3 className={`text-xl font-bold ${theme.text} mb-2`}>
                Assistant IA
              </h3>
              <p className={`${theme.textSecondary} text-center max-w-xs mb-4`}>
                Commencez une nouvelle conversation ou chargez une conversation existante depuis l'historique
              </p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 transition-all flex items-center gap-2"
              >
                <Menu className="w-4 h-4"/>
                Ouvrir le menu
              </button>
            </div>
          )}

          {/* Messages */}
          {!hasNoMessages && (
          <div className="space-y-1">
            {displayMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"} group`}
              >
                <div className={`max-w-[85%] ${msg.sender === "user" ? "max-w-[75%]" : ""}`}>
                  <div className={`px-3 py-2 rounded-lg shadow-sm relative ${
                    msg.sender === "user"
                      ? "bg-[#dcf8c6] text-gray-800 rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none"
                  } ${pinnedMessages.includes(msg.id) ? 'border-2 border-yellow-400' : ''}`}>
                    
                    {/* Badge épinglé */}
                    {pinnedMessages.includes(msg.id) && (
                      <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1">
                        <Pin className="w-3 h-3" />
                      </div>
                    )}

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

                    {/* Affichage pour les fichiers génériques (PDF, DOCX...) */}
                    {msg.fileData && !msg.fileData.preview && !msg.fileData.isAudio && (
                      <div className="flex items-center gap-2 mb-2 bg-gray-100 dark:bg-gray-700 p-2 rounded-lg border dark:border-gray-600">
                        <FileText className="w-6 h-6 text-indigo-500 shrink-0"/>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{msg.fileData.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(msg.fileData.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    )}

                    {msg.caption && (
                      <p className="text-sm text-gray-700 dark:text-gray-700 mb-1">{msg.caption}</p>
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

                    {/* Bouton menu d'actions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowActionsMenu(showActionsMenu === msg.id ? null : msg.id);
                      }}
                      className="absolute -right-8 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                    >
                      <Menu className="w-4 h-4" />
                    </button>

                    {showActionsMenu === msg.id && (
                      <MessageActionsMenu message={msg} />
                    )}
                  </div>
                  
                  {/* Questions suggérées - VERSION FINALE */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      <p className="text-xs text-gray-500 mb-1 px-1">💡 Questions suggérées :</p>
                      {msg.suggestedQuestions.map((question, index) => (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleSuggestedQuestion(question);
                          }}
                          className="suggested-question block w-full text-left px-3 py-2.5 rounded-lg text-sm bg-white hover:bg-blue-50 text-gray-800 border border-gray-200 hover:border-blue-300 transition-all shadow-sm active:bg-blue-100 active:scale-[0.98]"
                        >
                          <span className="text-blue-600 mr-1.5">•</span>
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Indicateur de chargement */}
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
          )}
        </div>

        {/* Barre de saisie */}
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
                className={`p-2 hover:bg-gray-200/20 rounded-full transition ${theme.textSecondary} ${isRecording ? 'animate-pulse bg-red-100' : ''} menu-button`}
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
                className={`absolute right-3 bottom-3 ${theme.textSecondary} hover:${theme.text} transition-colors menu-button`}
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
                  className={`p-2 rounded-full transition menu-button ${
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
