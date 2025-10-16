// Service pour vérifier un ticket via QR code
import api from './api';

// Interface pour la réponse du ticket complet
export interface TicketData {
  id: number;
  client: {
    id: number;
    nom: string;
    prenom: string;
    telephone: string;
    user: number;
  };
  evenement: {
    id: number;
    description: string;
    date: string;
    horraire: string;
    lieu: {
      id: number;
      nom: string;
    };
  };
  offre: {
    id: number;
    libelle: string;
    description: string;
    montant: number;
    nb_personne: number;
  };
  date_achat: string;
  statut: 'valide' | 'invalide';
}

export interface TicketVerificationResult {
  ticket?: TicketData;
  valid: boolean;
  message: string;
}

export const verifyTicket = async (qrCodeKey: string): Promise<TicketVerificationResult> => {
  try {
    console.log('🔍 Vérification du ticket avec la clé:', qrCodeKey);
    console.log('🌐 URL appelée:', `qrcode/${qrCodeKey}/`);

    const response = await api.get(`qrcode/${qrCodeKey}/`);
    const ticket: TicketData = response.data;

    console.log('✅ Réponse reçue:', ticket);

    // Vérifier le statut du ticket
    const isValid = ticket.statut === 'valide';

    return {
      ticket,
      valid: isValid,
      message: isValid ? 'Ticket valide' : 'Ticket invalide'
    };
  } catch (error: any) {
    console.log('❌ Erreur lors de la vérification:', error);
    console.log('📡 Status code:', error.response?.status);
    console.log('📋 Response data:', error.response?.data);
    console.log('🔗 Full URL:', error.config?.url);

    if (error.response?.status === 404) {
      return {
        valid: false,
        message: 'Ticket introuvable'
      };
    } else if (error.response?.status === 403) {
      const backendMessage = error.response?.data?.message || 'Accès refusé : réservé aux employés';
      return {
        valid: false,
        message: backendMessage
      };
    } else {
      throw error; // Relancer les autres erreurs pour qu'elles soient gérées par le composant
    }
  }
};
