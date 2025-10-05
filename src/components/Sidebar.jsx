// components/Sidebar.jsx
import React from 'react';
import { 
  X, MessageSquare, Clock, Settings, Info, Download, Share2, 
  User, LogOut, Trash2, Archive, Star, HelpCircle
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const Sidebar = () => {
  const {
    user,
    sidebarOpen,
    setSidebarOpen,
    setCurrentView,
    createNewConversation,
    handleLogout,
    conversationHistory,
    getThemeClasses,
    showNotification,
    clearChat
  } = useChatContext();

  const theme = getThemeClasses();

  if (!sidebarOpen) return null;

  const handleMenuClick = (action) => {
    setSidebarOpen(false);
    if (typeof action === 'function') {
      action();
    }
  };

  const handleExportData = () => {
    try {
      const dataToExport = {
        user: user,
        conversations: conversationHistory,
        exportDate: new Date().toISOString(),
        version: "1.0.0"
      };
      
      const dataStr = JSON.stringify(dataToExport, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `assistant-ia-data-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      showNotification("Données exportées avec succès !", "success");
    } catch (error) {
      showNotification("Erreur lors de l'export", "error");
    }
  };

  const handleShareApp = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Assistant IA Pro',
        text: 'Découvrez cette superbe app de chat avec IA !',
        url: window.location.href
      }).then(() => {
        showNotification("Partagé avec succès !", "success");
      }).catch(() => {
        fallbackShare();
      });
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showNotification("Lien copié dans le presse-papier !", "success");
    }).catch(() => {
      showNotification("Erreur lors du partage", "error");
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in" 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <div
          className={`fixed left-0 top-0 h-full w-80 ${theme.sidebar} backdrop-blur-xl transform transition-transform duration-300 z-50 shadow-2xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-gray-200/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-bold ${theme.text}`}>Menu</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className={`p-2 hover:bg-gray-200/20 rounded-xl ${theme.textSecondary} transition-colors`}
              >
                <X className="w-5 h-5"/>
              </button>
            </div>

            {/* Profil utilisateur */}
            {user && (
              <div className={`p-3 rounded-2xl ${theme.card} border`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white"/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${theme.text} truncate`}>{user.nom}</p>
                    <p className={`text-sm ${theme.textSecondary} truncate`}>{user.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Menu principal */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-2">
              {/* Nouvelle conversation */}
              <button
                onClick={() => handleMenuClick(createNewConversation)}
                className="w-full p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all mb-6 flex items-center justify-center gap-3 font-semibold shadow-lg transform hover:scale-[1.02]"
              >
                <MessageSquare className="w-5 h-5"/>
                Nouvelle conversation
              </button>

              {/* Navigation */}
              <div className="space-y-1">
                <SidebarItem
                  icon={Clock}
                  label="Historique"
                  onClick={() => handleMenuClick(() => setCurrentView("history"))}
                  theme={theme}
                  badge={conversationHistory.length > 0 ? conversationHistory.length : null}
                />

                <SidebarItem
                  icon={Settings}
                  label="Paramètres"
                  onClick={() => handleMenuClick(() => setCurrentView("settings"))}
                  theme={theme}
                />

                <SidebarItem
                  icon={Info}
                  label="À propos"
                  onClick={() => handleMenuClick(() => setCurrentView("about"))}
                  theme={theme}
                />

                <SidebarItem
                  icon={HelpCircle}
                  label="Aide"
                  onClick={() => handleMenuClick(() => showNotification("Guide d'utilisation à venir", "info"))}
                  theme={theme}
                />
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200/20 my-4"></div>

              {/* Actions avancées */}
              <div className="space-y-1">
                <SidebarItem
                  icon={Star}
                  label="Messages épinglés"
                  onClick={() => handleMenuClick(() => showNotification("Fonctionnalité à venir", "info"))}
                  theme={theme}
                />

                <SidebarItem
                  icon={Archive}
                  label="Conversations archivées"
                  onClick={() => handleMenuClick(() => showNotification("Fonctionnalité à venir", "info"))}
                  theme={theme}
                />

                <SidebarItem
                  icon={Download}
                  label="Exporter mes données"
                  onClick={() => handleMenuClick(handleExportData)}
                  theme={theme}
                />

                <SidebarItem
                  icon={Share2}
                  label="Partager l'application"
                  onClick={() => handleMenuClick(handleShareApp)}
                  theme={theme}
                />
              </div>

              {/* Séparateur */}
              <div className="border-t border-gray-200/20 my-4"></div>

              {/* Actions de conversation */}
              <div className="space-y-1">
                <SidebarItem
                  icon={Trash2}
                  label="Effacer la conversation"
                  onClick={() => handleMenuClick(clearChat)}
                  theme={theme}
                  variant="danger"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200/20">
            <button
              onClick={() => handleMenuClick(handleLogout)}
              className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${theme.text} hover:bg-red-100/20 hover:text-red-600 group`}
            >
              <LogOut className="w-5 h-5 group-hover:text-red-600"/>
              <span>Déconnexion</span>
            </button>

            {/* Version */}
            <div className="mt-4 text-center">
              <p className={`text-xs ${theme.textSecondary}`}>
                Assistant IA Pro v1.0.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Composant réutilisable pour les éléments de menu
const SidebarItem = ({ icon: Icon, label, onClick, theme, badge, variant = 'default' }) => {
  const variantStyles = {
    default: `${theme.text} hover:bg-gray-100/20`,
    danger: `${theme.text} hover:bg-red-100/20 hover:text-red-600`
  };

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${variantStyles[variant]} group`}
    >
      <Icon className={`w-5 h-5 ${variant === 'danger' ? 'group-hover:text-red-600' : ''}`}/>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full min-w-5 h-5 flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
};

export default Sidebar;