import React from "react";
import { 
  Code, Zap, Shield, Smartphone, Mail, Linkedin, Github, Globe, X 
} from "lucide-react";
import { useChatContext } from "../context/ChatContext";

const AboutScreen = () => {
  const { getThemeClasses, setCurrentView } = useChatContext();
  const theme = getThemeClasses();

  const handleClose = () => setCurrentView("chat");

  return (
    <div className={`min-h-screen ${theme.background} p-4`}>
      <div className={`w-full max-w-md mx-auto ${theme.card} rounded-3xl shadow-2xl border animate-slide-up`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/20">
          <h2 className={`text-xl font-bold ${theme.text}`}>À propos</h2>
          <button
            onClick={handleClose}
            className={`p-2 hover:bg-gray-200/20 rounded-xl transition ${theme.textSecondary}`}
          >
            <X className="w-5 h-5"/>
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Logo + version */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Smartphone className="w-10 h-10 text-white"/>
            </div>
            <h1 className={`text-2xl font-bold ${theme.text} mb-2`}>Winna Chat IA Pro</h1>
            <p className={`${theme.textSecondary} text-sm`}>Version 1.0.0</p>
          </div>

          {/* Description */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-3`}>À propos de l'application</h3>
            <p className={`${theme.textSecondary} leading-relaxed text-sm`}>
              Winna Chat IA Pro est une application de chat intelligente conçue pour faciliter vos interactions 
              avec l'intelligence artificielle. Profitez d'une expérience conversationnelle fluide, intuitive 
              et sécurisée.
            </p>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Fonctionnalités principales</h3>
            <div className="space-y-3">
              <Feature icon={<Zap className="w-5 h-5 text-yellow-500"/>} title="Réponses instantanées" description="IA ultra-rapide avec une précision incroyable plusque Google pour des réponses pertinentes" theme={theme}/>
              <Feature icon={<Globe className="w-5 h-5 text-blue-500"/>} title="Recherche web intégrée" description="Activez la recherche web pour des informations à jour" theme={theme}/>
              <Feature icon={<Shield className="w-5 h-5 text-green-500"/>} title="Sécurité et confidentialité" description="Authentification sécurisée et données chiffrées" theme={theme}/>
              <Feature icon={<Code className="w-5 h-5 text-purple-500"/>} title="Interface moderne" description="Design inspiré et super avancé, optimisé mobile" theme={theme}/>
            </div>
          </div>

          {/* Développeur */}
          <div className={`p-4 rounded-2xl border ${theme.card}`}>
            <h3 className={`font-semibold ${theme.text} mb-4`}>Développeur</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <span className="text-white text-xl font-bold">EK</span>
              </div>
              <div className="flex-1">
                <h4 className={`font-bold ${theme.text} text-lg`}>Evael Dimercia Kateng</h4>
                <p className={`${theme.textSecondary} text-sm mb-3`}>
                  Développeur Full-Stack spécialisé en IA et applications mobiles
                </p>
                <div className="flex flex-wrap gap-2">
                  <SocialLink icon={<Mail className="w-4 h-4"/>} label="Email" href="mailto:evael.kateng@example.com"/>
                  <SocialLink icon={<Linkedin className="w-4 h-4"/>} label="LinkedIn" href="https://linkedin.com/in/evael-kateng"/>
                  <SocialLink icon={<Github className="w-4 h-4"/>} label="GitHub" href="https://github.com/dimercia-dev"/>
                </div>
              </div>
            </div>
          </div>

          {/* Stack technique */}
          <div>
            <h3 className={`font-semibold ${theme.text} mb-3`}>Technologies utilisées</h3>
            <div className="flex flex-wrap gap-2">
              <Badge text="React"/>
              <Badge text="Node.js"/>
              <Badge text="PostgreSQL"/>
              <Badge text="Google Gemini AI"/>
              <Badge text="Tailwind CSS"/>
              <Badge text="n8n Automation"/>
            </div>
          </div>

          {/* Footer */}
          <div className={`text-center text-xs ${theme.textSecondary} pt-4 border-t`}>
            <p>© 2025 Winna Chat IA Pro. Tous droits réservés.</p>
            <p className="mt-1">Conçu et développé avec passion par Evael Dimercia Kateng</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Feature = ({ icon, title, description, theme }) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 mt-0.5">{icon}</div>
    <div>
      <h4 className={`font-semibold ${theme.text} text-sm`}>{title}</h4>
      <p className={`${theme.textSecondary} text-xs`}>{description}</p>
    </div>
  </div>
);

const SocialLink = ({ icon, label, href }) => (
  <a 
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs transition-colors"
  >
    {icon}
    <span>{label}</span>
  </a>
);

const Badge = ({ text }) => (
  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
    {text}
  </span>
);

export default AboutScreen;
