import { useState, useRef, useEffect, useCallback } from "react";
import { WEBHOOK_URL, API_KEY } from "../config";

export const useChat = (user) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [conversationHistory, setConversationHistory] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useState(() => "session_" + Math.random().toString(36).substr(2, 9))[0];

  // Auto-focus
  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, [inputMessage]);

  const handleInputChange = useCallback((e) => setInputMessage(e.target.value), []);
  const handleInputFocus = useCallback(() => inputRef.current?.focus({ preventScroll: true }), []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);

  const playNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhCz2W3/LFeSMFl2+z6NuWQ2U=');
    audio.play().catch(() => {});
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      status: "sending",
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);
    setConnectionStatus("connecting");

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": API_KEY },
        body: JSON.stringify({
          chatInput: userMessage.text,
          sessionId,
          userId: user?.id,
          timestamp: new Date().toISOString(),
          web_search: webSearchActive
        }),
      });

      if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
      const data = await response.json();

      setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, status: "delivered" } : msg));
      let botResponse = data.data?.response || data.response || data.output || "Désolé, je n'ai pas pu traiter votre demande.";

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botResponse, sender: "bot", timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), status: "delivered", formatted: true }]);
      setConnectionStatus("connected");
      playNotificationSound();
    } catch (error) {
      setMessages(prev => prev.map(msg => msg.id === userMessage.id ? { ...msg, status: "error" } : msg));
      setConnectionStatus("error");
    } finally { setIsLoading(false); }
  };

  return {
    messages, setMessages, inputMessage, setInputMessage, handleInputChange,
    handleInputFocus, isLoading, sendMessage, messagesEndRef,
    conversationHistory, setConversationHistory, conversations, setConversations,
    currentConversation, setCurrentConversation, connectionStatus, setConnectionStatus,
    sessionId, webSearchActive, setWebSearchActive, inputRef
  };
};
