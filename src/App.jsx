import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ChatProvider, useChatContext } from './context/ChatContext';
import LoginScreen from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import SettingsScreen from './components/SettingsScreen';
import HistoryScreen from './components/HistoryScreen';
import AboutScreen from './components/AboutScreen';
import EmailVerificationPage from './components/EmailVerificationPage';
import NotificationComponent from './components/NotificationComponent';

function AppContent() {
  const { currentView, isAuthenticated, authLoading } = useChatContext();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const renderView = () => {
    if (!isAuthenticated) return <LoginScreen />;
    
    switch (currentView) {
      case 'chat': return <ChatScreen />;
      case 'settings': return <SettingsScreen />;
      case 'history': return <HistoryScreen />;
      case 'about': return <AboutScreen />;
      default: return <ChatScreen />;
    }
  };

  return (
    <>
      {renderView()}
      <NotificationComponent />
    </>
  );
}

function App() {
  return (
    <Router>
      <ChatProvider>
        <Routes>
          <Route path="/verify/:token" element={<EmailVerificationPage />} />
          <Route path="*" element={<AppContent />} />
        </Routes>
      </ChatProvider>
    </Router>
  );
}

export default App;