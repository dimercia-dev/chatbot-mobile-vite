// components/HistoryScreen.jsx
import React, { useState } from 'react';
import { 
  X, Clock, Search, Trash2, Download, ChevronRight
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const HistoryScreen = () => {
  const {
    setCurrentView,
    conversationHistory,
    setConversationHistory,
    loadConversation,
    getThemeClasses,
    showNotification
  } = useChatContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');

  const theme = getThemeClasses();

  const handleClose = () => {
    setCurrentView("chat");
  };

  const filteredConversations = conversationHistory.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages?.some(msg => 
        msg.text.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (!matchesSearch) return false;
    
    if (selectedFilter === 'all') return true;
    
    const now = new Date();
    const convDate = new Date(conv.createdAt);
    
    switch (selectedFilter) {
      case 'today':
        return now.toDateString() === convDate.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return convDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return convDate >= monthAgo;
      default:
        return true;
    }
  });

  const handleExportConversation = (conversation) => {
    try {
      const dataToExport = {
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        exportDate: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `conversation-${conversation.id}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showNotification("Conversation exportée !", "success");
    } catch (error) {
      showNotification("Erreur lors de l'export", "error");
    }
  };

  const handleDeleteConversation = (conversationId) => {
    if (window.confirm("Supprimer définitivement cette conversation ?")) {
      const updatedHistory = conversationHistory.filter(c => c.id !== conversationId);
      setConversationHistory(updatedHistory);
      localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
      showNotification("Conversation supprimée", "success");
    }
  };

  const handleLoadConversation = (conversationId) => {
    loadConversation(conversationId);
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}j`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}min`;
    return 'maintenant';
  };

  return (
    <div className={`min-h-screen ${theme.background} p-3`}>
      <div className={`w-full max-w-md mx-auto ${theme.card} rounded-2xl shadow-2xl border animate-slide-up`}>
        
        <div className="flex items-center justify-between p-4 border-b border-gray-200/20">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500"/>
            <h2 className={`text-lg font-bold ${theme.text}`}>Historique</h2>
          </div>
          <button
            onClick={handleClose}
            className={`p-1.5 hover:bg-gray-200/20 rounded-lg transition ${theme.textSecondary}`}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-3 border-b border-gray-200/20 space-y-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${theme.textSecondary}`}/>
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl border ${theme.input} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm`}
            />
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'all', label: 'Tout' },
              { key: 'today', label: "Aujourd'hui" },
              { key: 'week', label: '7 jours' },
              { key: 'month', label: '30 jours' }
            ].map(filter => (
              <button
                key={filter.key}
                onClick={() => setSelectedFilter(filter.key)}
                className={`px-2.5 py-1 rounded-full text-xs transition ${
                  selectedFilter === filter.key 
                    ? 'bg-blue-500 text-white' 
                    : `bg-gray-100/50 ${theme.textSecondary} hover:bg-gray-200/50`
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-240px)]">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8">
              <Clock className={`w-12 h-12 ${theme.textSecondary} mx-auto mb-3 opacity-50`}/>
              <h3 className={`font-semibold ${theme.text} mb-1 text-sm`}>
                {searchQuery ? 'Aucun résultat' : 'Aucun historique'}
              </h3>
              <p className={`text-xs ${theme.textSecondary}`}>
                {searchQuery 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Vos conversations apparaîtront ici'
                }
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1.5">
              {filteredConversations.map(conv => (
                <ConversationCard
                  key={conv.id}
                  conversation={conv}
                  theme={theme}
                  onLoad={() => handleLoadConversation(conv.id)}
                  onExport={() => handleExportConversation(conv)}
                  onDelete={() => handleDeleteConversation(conv.id)}
                  getRelativeTime={getRelativeTime}
                />
              ))}
            </div>
          )}
        </div>

        {conversationHistory.length > 0 && (
          <div className="p-3 border-t border-gray-200/20">
            <div className="flex items-center justify-between text-xs">
              <span className={theme.textSecondary}>
                {conversationHistory.length} conversation{conversationHistory.length > 1 ? 's' : ''}
              </span>
              <span className={theme.textSecondary}>
                {filteredConversations.length} affichée{filteredConversations.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationCard = ({ conversation, theme, onLoad, onExport, onDelete, getRelativeTime }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
  const messageCount = conversation.messages?.length || 0;
  
  return (
    <div className={`border rounded-xl p-3 transition-all hover:shadow-md ${theme.card} cursor-pointer`}>
      <div onClick={onLoad}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-2">
            <h3 className={`font-semibold ${theme.text} truncate hover:text-blue-500 transition-colors text-sm`}>
              {conversation.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[11px] ${theme.textSecondary}`}>
                {getRelativeTime(conversation.createdAt)}
              </span>
              <span className="text-[11px] text-gray-400">•</span>
              <span className={`text-[11px] ${theme.textSecondary}`}>
                {messageCount} msg
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onExport}
              className={`p-1.5 hover:bg-gray-200/20 rounded-lg transition ${theme.textSecondary}`}
              title="Exporter"
            >
              <Download className="w-3.5 h-3.5"/>
            </button>
            <button
              onClick={onDelete}
              className={`p-1.5 hover:bg-red-100/20 hover:text-red-600 rounded-lg transition ${theme.textSecondary}`}
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5"/>
            </button>
          </div>
        </div>

        {lastMessage && (
          <div className={`text-xs ${theme.textSecondary} mb-2`}>
            <p className="line-clamp-2 leading-relaxed">
              {lastMessage.sender === 'user' ? '👤 ' : '🤖 '}
              {lastMessage.text.length > 80 
                ? `${lastMessage.text.substring(0, 80)}...` 
                : lastMessage.text
              }
            </p>
          </div>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded(!isExpanded);
        }}
        className={`w-full flex items-center justify-center gap-1 py-1.5 text-xs ${theme.textSecondary} hover:${theme.text} transition-colors border-t border-gray-200/20 mt-2 pt-2`}
      >
        <span>{isExpanded ? 'Réduire' : 'Détails'}</span>
        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}/>
      </button>

      {isExpanded && (
        <div className="mt-2 pt-2 border-t border-gray-200/20 animate-fade-in">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={theme.textSecondary}>Créée :</span>
              <span className={theme.text}>
                {new Date(conversation.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>

            {conversation.messages && conversation.messages.length > 0 && (
              <div>
                <h4 className={`text-xs font-semibold ${theme.text} mb-1.5`}>Aperçu :</h4>
                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {conversation.messages.slice(0, 3).map((msg, index) => (
                    <div key={index} className="text-[11px] leading-relaxed">
                      <span className={`${theme.textSecondary} line-clamp-2`}>
                        {msg.sender === 'user' ? '👤 ' : '🤖 '}
                        {msg.text.length > 60 ? `${msg.text.substring(0, 60)}...` : msg.text}
                      </span>
                    </div>
                  ))}
                  {conversation.messages.length > 3 && (
                    <p className={`text-[11px] ${theme.textSecondary} italic`}>
                      +{conversation.messages.length - 3} message{conversation.messages.length - 3 > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryScreen;