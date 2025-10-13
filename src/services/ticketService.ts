// Service pour vérifier un ticket via QR code
import api from './api';

export const verifyTicket = async (qrCode: string): Promise<{ valid: boolean }> => {
  const response = await api.post('tickets/verify/', { qr_code: qrCode });
  return response.data;
};
