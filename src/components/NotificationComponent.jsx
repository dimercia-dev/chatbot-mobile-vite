// components/NotificationComponent.jsx
import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const NotificationComponent = () => {
  const { notification, setNotification } = useChatContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [notification]);

  const handleClose = () => {
    setNotification(null);
  };

  if (!notification) return null;

  const getNotificationConfig = (type) => {
    const configs = {
      success: {
        bgColor: 'bg-green-500',
        textColor: 'text-white',
        icon: CheckCircle,
        borderColor: 'border-green-600'
      },
      error: {
        bgColor: 'bg-red-500',
        textColor: 'text-white',
        icon: AlertCircle,
        borderColor: 'border-red-600'
      },
      warning: {
        bgColor: 'bg-yellow-500',
        textColor: 'text-white',
        icon: AlertTriangle,
        borderColor: 'border-yellow-600'
      },
      info: {
        bgColor: 'bg-blue-500',
        textColor: 'text-white',
        icon: Info,
        borderColor: 'border-blue-600'
      }
    };

    return configs[type] || configs.info;
  };

  const config = getNotificationConfig(notification.type);
  const IconComponent = config.icon;

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-[100] transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div
        className={`${config.bgColor} ${config.textColor} rounded-2xl shadow-2xl border ${config.borderColor} overflow-hidden animate-slide-down`}
      >
        <div className="flex items-center p-4 gap-3">
          {/* Icône */}
          <div className="flex-shrink-0">
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Contenu */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {notification.message}
            </p>
          </div>

          {/* Bouton de fermeture */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-black/20 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Fermer la notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Barre de progression (optionnelle) */}
        <div className="h-1 bg-black/20">
          <div 
            className="h-full bg-white/30 animate-progress"
            style={{
              animation: 'progress 4s linear forwards'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NotificationComponent;