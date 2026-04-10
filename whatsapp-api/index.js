require('dotenv').config();
const express = require('express');
const cors = require('cors');

const memoryState = require('./src/state/memoryState');
const { subscriber } = require('./src/redis/redisClient');
const clientManager = require('./src/whatsapp/clientManager');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;

// ==========================================
// 1. Escuta Eventos Redis (Sincronização)
// ==========================================

// Canais que vamos assinar:
// updates_queue -> quando as posições das filas mudarem
// updates_whitelist -> quando a whitelist de alguem mudar
subscriber.subscribe('updates_queue', 'updates_whitelist', (err, count) => {
    if (err) {
        console.error('[Redis] Erro ao assinar canais:', err);
    } else {
        console.log(`[Redis] Assinatura ativa em ${count} canais! O estado inicial da RAM será construído conforme as atualizações chegarem.`);
    }
});

subscriber.on('message', (channel, message) => {
    try {
        const payload = JSON.parse(message);

        if (channel === 'updates_queue') {
            // Esperado: { "groupId": "120363@g.us", "userId": "12" }
            // Ou para remover: { "groupId": "120363@g.us", "userId": null }
            if (payload.groupId) {
                if (payload.userId) {
                    memoryState.setPositionOne(payload.groupId, payload.userId);
                    console.log(`[RAM] Fila ${payload.groupId} atualizada -> Posição 1: ${payload.userId}`);
                } else {
                    memoryState.removeQueue(payload.groupId);
                    console.log(`[RAM] Fila ${payload.groupId} liberada.`);
                }
            }
        } else if (channel === 'updates_whitelist') {
            // Esperado: { "userId": "12", "companies": ["55119999@c.us", "55118888@c.us"] }
            if (payload.userId && payload.companies) {
                memoryState.setWhitelist(payload.userId, payload.companies);
                console.log(`[RAM] Whitelist atualizada para usuário ${payload.userId} (+${payload.companies.length} empresas).`);
            }
        }
    } catch (error) {
        console.error('[Redis] Erro ao interpretar json de pub/sub:', error);
    }
});

// ==========================================
// 2. Micro-API HTTP (Gerenciamento)
// ==========================================

// Endpoint de diagnóstico
app.get('/health', (req, res) => {
    res.json({ 
        status: 'working_in_sniper_mode',
        memorySnapshot: memoryState.debugState() 
    });
});

// Rota chamada pelo Backend/Frontend para solicitar inicialização de uma sessão
app.post('/session/start', (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    clientManager.initializeClient(userId);
    res.json({ message: 'Inicialização programada/em andamento.', userId });
});

// Rota chamada em poll pelo Frontend (via backend ou direto) para pegar o QR ou status
app.get('/session/:userId/status', (req, res) => {
    const { userId } = req.params;
    const status = clientManager.getClientStatus(userId);
    const qr = clientManager.getClientQr(userId);

    res.json({
        userId,
        status,
        qr
    });
});

app.post('/session/logout', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId is required' });

    const destroyed = await clientManager.destroyClient(userId);
    res.json({ message: 'Logout concluído com sucesso e arquivos deletados.', destroyed });
});

// Inicia servidor interno
app.listen(PORT, () => {
    console.log(`
===========================================================
  QUEUEBOT V4 - WHATSAPP API (Container 5)                 
  Porta Interna: ${PORT}                                   
  Modo: FRANCO-ATIRADOR (Sniper Mode)                      
  Armazenamento de Fila/Whitelist: TOTALMENTE EM RAM (0-ms)
===========================================================`);
});
