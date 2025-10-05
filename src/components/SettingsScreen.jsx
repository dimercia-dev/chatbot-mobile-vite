// components/SettingsScreen.jsx
import React from 'react';
import { 
  X, Moon, Sun, Volume2, VolumeX, Type, Shield, 
  User, Mail, Smartphone, Globe, Bell, Lock, Trash2 
} from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const SettingsScreen = () => {
  const {
    user,
    setCurrentView,
    darkMode,
    setDarkMode,
    fontSize,
    setFontSize,
    soundEnabled,
    setSoundEnabled,
    sessionId,
    connectionStatus,
    pinnedMessages,
    getThemeClasses,
    showNotification,
    handleLogout
  } = useChatContext();

  const theme = getThemeClasses();

  const handleClose = () => {
    setCurrentView("chat");
  };

  const handleClearAllData = () => {
    if (window.confirm("Êtes-vous sûr de vouloir effacer toutes vos données ? Cette action est irréversible.")) {
      localStorage.clear();
      showNotification("Toutes les données ont été effacées", "success");
      handleLogout();
    }
  };

  const handleExportSettings = () => {
    const settings = {
      darkMode,
      fontSize,
      soundEnabled,
      exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `assistant-ia-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification("Paramètres exportés !", "success");
  };

  return (
    <div className={`min-h-screen ${theme.background} p-4`}>
      <div className={`w-full max-w-md mx-auto ${theme.card} rounded-3xl shadow-2xl border animate-slide-up`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/20">
          <h2 className={`text-xl font-bold ${theme.text}`}>Paramètres</h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Profil utilisateur */}
          {user && (
            <div className={`p-4 rounded-2xl border ${theme.card}`}>
              <h3 className={`font-semibold ${theme.text} mb-3 flex items-center gap-2`}>
                <User className="w-5 h-5"/>
                Profil
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className={theme.textSecondary}>Nom :</span>
                  <span className={theme.text}>{user.nom}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme.textSecondary}>Email :</span>
                  <span className={theme.text}>{user.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={theme.textSecondary}>Vérifié :</span>
                  <span className={`${user.emailVerified ? 'text-green-600' : 'text-orange-600'}`}>
                    {user.emailVerified ? '✓ Oui' : '⚠ Non'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Apparence */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-4`}>Apparence</h3>
            
            {/* Mode sombre */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5 text-blue-500"/> : <Sun className="w-5 h-5 text-yellow-500"/>}
                <div>
                  <h4 className={`font-semibold ${theme.text}`}>Mode sombre</h4>
                  <p className={`text-sm ${theme.textSecondary}`}>Interface sombre pour vos yeux</p>
                </div>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  darkMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform absolute top-0.5 ${
                  darkMode ? 'translate-x-7' : 'translate-x-0.5'
                }`}></div>
              </button>
            </div>

            {/* Taille du texte */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Type className="w-5 h-5 text-purple-500"/>
                <h4 className={`font-semibold ${theme.text}`}>Taille du texte</h4>
              </div>
              <div className="flex gap-2">
                {[
                  { key: 'small', label: 'Petit' },
                  { key: 'medium', label: 'Moyen' },
                  { key: 'large', label: 'Grand' }
                ].map(size => (
                  <button
                    key={size.key}
                    onClick={() => setFontSize(size.key)}
                    className={`flex-1 px-3 py-2 rounded-xl text-sm transition ${
                      fontSize === size.key 
                        ? 'bg-blue-500 text-white shadow-lg' 
                        : `bg-gray-100/50 ${theme.textSecondary} hover:bg-gray-200/50`
                    }`}
                  >
                    {size.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Audio */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-4`}>Audio</h3>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="w-5 h-5 text-green-500"/> : <VolumeX className="w-5 h-5 text-red-500"/>}
                <div>
                  <h4 className={`font-semibold ${theme.text}`}>Notifications sonores</h4>
                  <p className={`text-sm ${theme.textSecondary}`}>Sons pour nouveaux messages</p>
                </div>
              </div>
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition ${
                  soundEnabled 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5"/> : <VolumeX className="w-5 h-5"/>}
              </button>
            </div>
          </div>

          {/* Informations système */}
          <div className={`p-4 rounded-2xl border ${theme.card}`}>
            <div className="flex items-center gap-3 mb-3">
              <Shield className="w-5 h-5 text-indigo-500"/>
              <h3 className={`font-semibold ${theme.text}`}>Informations système</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Session ID :</span>
                <span className={`${theme.text} font-mono text-xs`}>
                  {sessionId.substring(0, 12)}...
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Statut :</span>
                <span className={`${
                  connectionStatus === 'connected' ? 'text-green-600' : 
                  connectionStatus === 'connecting' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {connectionStatus === 'connected' ? 'Connecté' : 
                   connectionStatus === 'connecting' ? 'Connexion...' : 'Déconnecté'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Messages épinglés :</span>
                <span className={theme.text}>{pinnedMessages.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className={theme.textSecondary}>Version :</span>
                <span className={theme.text}>1.0.0</span>
              </div>
            </div>
          </div>

          {/* Actions avancées */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-4`}>Actions</h3>
            <div className="space-y-3">
              
              {/* Exporter paramètres */}
              <button
                onClick={handleExportSettings}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${theme.text} hover:bg-blue-100/20 hover:text-blue-600 border border-gray-200/50`}
              >
                <Globe className="w-5 h-5"/>
                <span>Exporter les paramètres</span>
              </button>

              {/* Notifications */}
              <button
                onClick={() => showNotification("Gestion des notifications à venir", "info")}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${theme.text} hover:bg-gray-100/20 border border-gray-200/50`}
              >
                <Bell className="w-5 h-5"/>
                <span>Gérer les notifications</span>
              </button>

              {/* Confidentialité */}
              <button
                onClick={() => showNotification("Paramètres de confidentialité à venir", "info")}
                className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${theme.text} hover:bg-gray-100/20 border border-gray-200/50`}
              >
                <Lock className="w-5 h-5"/>
                <span>Confidentialité</span>
              </button>
            </div>
          </div>

          {/* Zone de danger */}
          <div className="border border-red-200 rounded-2xl p-4 bg-red-50/50">
            <h3 className="font-semibold text-red-700 mb-3">Zone de danger</h3>
            <button
              onClick={handleClearAllData}
              className="w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2 font-semibold"
            >
              <Trash2 className="w-4 h-4"/>
              Effacer toutes les données
            </button>
            <p className="text-xs text-red-600 mt-2 text-center">
              Cette action supprimera définitivement toutes vos données locales
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsScreen;