import { Redis } from 'ioredis';
import { handleRunTaken } from './queueService';

const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;

export const publisher = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

export const subscriber = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
});

// ==========================================
// OUTBOUND: Enviando pro Container 5
// ==========================================

export function publishNewTarget(groupId: string, phoneIdUser:     string | null) {
  const payload = { groupId, userId: phoneIdUser };
  publisher.publish('updates_queue', JSON.stringify(payload));
  console.log(`[Redis Publisher] Disparo para atualizar fila em RAM -> Grupo: ${groupId} (Novo Foco: ${phoneIdUser || 'VAZIO'})`);
}

export function publishWhitelist(phoneIdUser: string, companiesPhoneIds: string[]) {
  const payload = { userId: phoneIdUser, companies: companiesPhoneIds };
  publisher.publish('updates_whitelist', JSON.stringify(payload));
  console.log(`[Redis Publisher] Disparo para renovar whitelist em RAM -> User: ${phoneIdUser} (${companiesPhoneIds.length} permissoes)`);
}

// ==========================================
// INBOUND: Ouvindo o Container 5
// ==========================================

export function initRedisSubscriber() {
  // "run_taken" é disparado quando a mensagem "Eu" vai pro WebSocket do Whatsapp
  subscriber.subscribe('run_taken', (err, count) => {
    if (err) {
      console.error('[Redis Subscriber] Erro ao subscrever canal:', err);
    } else {
      console.log(`[Redis Subscriber] Backend assinado e rodando ouvinte ativo.`);
    }
  });

  subscriber.on('message', async (channel, message) => {
    try {
      const payload = JSON.parse(message);
      
      if (channel === 'run_taken') {
        const { userId, groupId, companyId, timestamp } = payload;
        // userId neste payload vem do C5, correspondendo ao "phoneIdUser"
        console.log(`[Redis Subscriber] 🎯 "Eu" disparado! O entregador ${userId} obteve sucesso vs Empresa ${companyId} - Grupo ${groupId}`);
        
        // Chamada de regra de negocio principal para avançar a fila e promover galera
        await handleRunTaken(userId, groupId, companyId);
      }
    } catch (e) {
      console.error('[Redis Subscriber] Exception no event handler:', e);
    }
  });
}
