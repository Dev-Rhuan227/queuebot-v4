import axios from 'axios';

// Utilizando dns interno da rede Docker-Compose ("whatsapp-api" eh o nome do servico no docker-compose.yml)
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'http://whatsapp-api:3000';

/**
 * Manda um comando forte ao Franco-Atirador exigindo que libere o Puppeteer  
 * e crie a matriz de cache do usuario ou se reconecte ao QR.
 */
export async function requestWhatsappSession(userId: string) {
  try {
    const response = await axios.post(`${WHATSAPP_API_URL}/session/start`, { userId });
    return response.data;
  } catch (error: any) {
    console.error(`[WhatsappApiService] Falha em requestWhatsappSession (${userId}):`, error?.response?.data || error.message);
    throw error;
  }
}

/**
 * Poll (ou requisição avulsa) que o Frontend invoca indiretamente passando por nós
 * (O frontend do entregador chama /api/whatsapp/status, que cai nisso aqui).
 * Traz o Base64 se disponivel (QR gerado) ou a indicação READY (pronto pra lucrar).
 */
export async function fetchSessionStatus(userId: string) {
  try {
    const response = await axios.get(`${WHATSAPP_API_URL}/session/${userId}/status`);
    return response.data;
  } catch (error: any) {
    console.error(`[WhatsappApiService] Falha em fetchSessionStatus (${userId}):`, error?.response?.data || error.message);
    throw error;
  }
}

export async function killWhatsappSession(userId: string) {
  try {
    const response = await axios.post(`${WHATSAPP_API_URL}/session/logout`, { userId });
    return response.data;
  } catch (error: any) {
    console.error(`[WhatsappApiService] Falha em killWhatsappSession (${userId}):`, error?.response?.data || error.message);
    throw error;
  }
}
