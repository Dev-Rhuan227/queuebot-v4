import { create } from 'zustand';

export interface AppState {
  user: { id: string; phoneId: string; name: string } | null;
  queueStatus: 'idle' | 'waiting' | 'position_1' | 'captured';
  whatsappStatus: 'NOT_FOUND' | 'INITIALIZING' | 'QR_CODE_READY' | 'AUTHENTICATED' | 'READY' | 'DISCONNECTED';
  qrCodeBase64: string | null;
  positionNumber: number | null;
  activeDeliveryId: string | null;
  
  setUser: (user: AppState['user']) => void;
  setQueueStatus: (status: AppState['queueStatus'], position?: number) => void;
  setWhatsappState: (status: AppState['whatsappStatus'], qr: string | null) => void;
  setActiveDelivery: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Mock data para podermos renderizar a UI inicial com dados
  user: { id: 'u1', phoneId: '5511999999999@c.us', name: 'Rodrigo Motoboy' },
  
  queueStatus: 'idle',
  whatsappStatus: 'NOT_FOUND',
  qrCodeBase64: null,
  positionNumber: null,
  activeDeliveryId: null,

  setUser: (user) => set({ user }),
  setQueueStatus: (status, position = null) => set({ queueStatus: status, positionNumber: position }),
  setWhatsappState: (status, qr) => set({ whatsappStatus: status, qrCodeBase64: qr }),
  setActiveDelivery: (id) => set({ activeDeliveryId: id }),
}));
