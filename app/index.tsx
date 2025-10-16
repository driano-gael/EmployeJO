import React from "react";
import { useUser } from "../src/context/UserContext";
import LoginScreen from "../src/screens/LoginScreen";
import ScanQRCodeScreen from "../src/screens/ScanQRCodeScreen";

export default function Index() {
  const { user } = useUser();

  // Si l'utilisateur est connecté et a le rôle employé, afficher le scanner
  if (user && user.role === "employe") {
    return <ScanQRCodeScreen />;
  }

  // Sinon, afficher l'écran de connexion
  return <LoginScreen />;
}
