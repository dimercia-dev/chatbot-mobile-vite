// components/EmailVerificationPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useChatContext } from '../context/ChatContext';

const EmailVerificationPage = () => {
  const { token } = useParams(); // Récupérer le token depuis l'URL
  const navigate = useNavigate();
  const { setCurrentView, showNotification, getThemeClasses } = useChatContext();
  const [verificationStatus, setVerificationStatus] = useState('loading');
  const [message, setMessage] = useState('');
  
  const theme = getThemeClasses();

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationStatus('error');
        setMessage('Token de vérification manquant');
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://chatbot-auth-backend.onrender.com'}/api/auth/verify/${token}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setVerificationStatus('success');
          setMessage(data.data.message || 'Votre email a été vérifié avec succès !');
          showNotification('Email vérifié ! Vous pouvez maintenant vous connecter.', 'success');
          
          // Redirection vers login après 3 secondes
          setTimeout(() => {
            navigate('/');
            setCurrentView('login');
          }, 3000);
        } else {
          setVerificationStatus('error');
          setMessage(data.error?.message || 'Erreur lors de la vérification');
        }
        
      } catch (error) {
        setVerificationStatus('error');
        setMessage('Erreur de connexion au serveur');
        console.error('Erreur vérification:', error);
      }
    };

    verifyEmail();
  }, [token, showNotification, navigate, setCurrentView]);

  const handleGoToLogin = () => {
    navigate('/');
    setCurrentView('login');
  };

  return (
    <div className={`min-h-screen ${theme.background} flex items-center justify-center p-4`}>
      <div className={`w-full max-w-md ${theme.card} rounded-3xl shadow-2xl p-8 border animate-fade-in`}>
        <div className="text-center">
          <div className="mb-6">
            {verificationStatus === 'loading' && (
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto animate-pulse">
                <Loader2 className="w-10 h-10 text-white animate-spin"/>
              </div>
            )}
            
            {verificationStatus === 'success' && (
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle className="w-10 h-10 text-white"/>
              </div>
            )}
            
            {verificationStatus === 'error' && (
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-3xl flex items-center justify-center mx-auto">
                <XCircle className="w-10 h-10 text-white"/>
              </div>
            )}
          </div>

          <h1 className={`text-2xl font-bold ${theme.text} mb-4`}>
            {verificationStatus === 'loading' && 'Vérification en cours...'}
            {verificationStatus === 'success' && 'Email vérifié !'}
            {verificationStatus === 'error' && 'Erreur de vérification'}
          </h1>

          <p className={`${theme.textSecondary} mb-6`}>{message}</p>

          {verificationStatus === 'success' && (
            <div className="space-y-4">
              <button
                onClick={handleGoToLogin}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all transform hover:scale-[1.02] font-semibold shadow-xl group flex items-center justify-center gap-2"
              >
                Se connecter maintenant
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
              </button>
              <p className={`text-xs ${theme.textSecondary}`}>
                Redirection automatique dans quelques secondes...
              </p>
            </div>
          )}

          {verificationStatus === 'error' && (
            <button
              onClick={handleGoToLogin}
              className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-[1.02] font-semibold shadow-xl group flex items-center justify-center gap-2"
            >
              Retour à la connexion
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;