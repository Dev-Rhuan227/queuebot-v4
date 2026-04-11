const { Client, LocalAuth } = require('whatsapp-web.js');
const configureMessageListener = require('./messageListener');

// Armazena as sessões ativas: { userId: { client, status, qr } }
const clients = {}; 

const initializeClient = (userId) => {
    if (clients[userId]) {
        console.log(`[ClientManager] Sessão ${userId} já existe.`);
        return clients[userId];
    }

    console.log(`[ClientManager] Inicializando sessão ${userId}...`);

    // Remove o '@c.us' ou qualquer caractere especial para que o LocalAuth aceite
    const safeClientId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
    
    // Usando LocalAuth para reter a sessão (evita logins recorrentes)
    const client = new Client({
        authStrategy: new LocalAuth({ clientId: `user_${safeClientId}` }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        }
    });

    clients[userId] = {
        client,
        status: 'INITIALIZING',
        qr: null,
    };

    client.on('qr', (qr) => {
        console.log(`[ClientManager] Novo QR gerado para sessão ${userId}.`);
        clients[userId].status = 'QR_CODE_READY';
        clients[userId].qr = qr; // Armazena a string para consumir pela micro-api
    });

    client.on('authenticated', () => {
        console.log(`[ClientManager] Sessão ${userId} autenticada!`);
        clients[userId].status = 'AUTHENTICATED';
        clients[userId].qr = null;
    });

    client.on('ready', async () => {
        console.log(`[ClientManager] Sessão ${userId} READY! Modo atirador iniciado.`);
        clients[userId].status = 'READY';
        clients[userId].qr = null;

        // Otimização Extrema da Interface Puppeteer
        try {
            const page = client.pupPage;
            if (page) {
                await page.setRequestInterception(true);
                page.on('request', (req) => {
                    const type = req.resourceType();
                    // Bloquear absolutamente tudo que não for crítico
                    if (['image', 'media', 'font', 'stylesheet'].includes(type)) {
                        req.abort();
                    } else {
                        req.continue();
                    }
                });
                console.log(`[ClientManager] Filtros de rede ativados no navegador (Sniper Mode).`);
            }
        } catch (err) {
            console.error(`[ClientManager] Não foi possível ativar interceptação de rede:`, err);
        }
    });

    client.on('auth_failure', err => {
        console.error(`[ClientManager] Falha na sessão ${userId}:`, err);
        clients[userId].status = 'AUTH_FAILURE';
    });
    
    client.on('disconnected', (reason) => {
        console.log(`[ClientManager] Sessão ${userId} desconectada: ${reason}`);
        clients[userId].status = 'DISCONNECTED';
        clients[userId].qr = null;
    });

    // Anexa a lógica principal (onde mora os filtros de Fila/Whitelist)
    configureMessageListener(client, String(userId));

    client.initialize();

    return clients[userId];
};

const getClientStatus = (userId) => {
    return clients[userId] ? clients[userId].status : 'NOT_FOUND';
};

const getClientQr = (userId) => {
    return clients[userId] ? clients[userId].qr : null;
};

const destroyClient = async (userId) => {
    if (clients[userId]) {
        try {
            console.log(`[ClientManager] Executando LOGOUT real e desligando Puppeteer da sessão ${userId}...`);
            // client.logout() emite a desvinculação completa pro servidor do WA e apaga o disco autônomamente na flag LocalAuth
            await clients[userId].client.logout(); 
        } catch (e) {
            console.error(`[ClientManager] Teto de falha atingido, matando browser na foice:`, e);
            await clients[userId].client.destroy().catch(() => null);
        }
        delete clients[userId]; // Limpa a RAM global
        console.log(`[ClientManager] Sessão ${userId} expurgada com sucesso.`);
        return true;
    }
    return false;
};

module.exports = {
    initializeClient,
    getClientStatus,
    getClientQr,
    destroyClient,
    clients
};
