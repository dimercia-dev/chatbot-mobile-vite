import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from "react-router-dom";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("pending"); // pending, success, error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(
          `https://chatbot-auth-backend.onrender.com/api/auth/verify/${token}`,
          {
            method: "GET",
            headers: {
              "Accept": "application/json"
            },
          }
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.data.message || "Email vérifié avec succès !");
          // Rediriger automatiquement vers la page de login après 3s
          setTimeout(() => navigate("/login"), 3000);
        } else {
          setStatus("error");
          setMessage(data.error?.message || "Erreur lors de la vérification.");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Impossible de contacter le serveur.");
      }
    };

    if (token) verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md text-center">
        {status === "pending" && <p>Vérification en cours...</p>}
        {status === "success" && (
          <>
            <h2 className="text-green-600 font-bold text-xl mb-2">✅ Succès !</h2>
            <p>{message}</p>
            <p className="mt-4 text-sm text-gray-500">
              Vous allez être redirigé vers la page de connexion.
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <h2 className="text-red-600 font-bold text-xl mb-2">❌ Erreur</h2>
            <p>{message}</p>
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-xl"
              onClick={() => navigate("/login")}
            >
              Retour à la connexion
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
