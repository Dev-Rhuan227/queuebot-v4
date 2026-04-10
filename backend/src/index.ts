import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma, joinQueue } from './services/queueService';
import { initRedisSubscriber } from './services/redisService';
import { requestWhatsappSession, fetchSessionStatus, killWhatsappSession } from './services/whatsappApiService';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3333; // Porta mapeada no docker-compose.yml

// ===================================
// Endpoints de Integração com Frontend (SaaS)
// ===================================

/**
 * Ponto de entrada crítico: O Entregador clica em "Entrar na Fila" no App Frontend.
 * Body: { "userId": "ID_DO_USER_AQUI", "groupId": "ID_DO_GRUPO_AQUI" }
 */
app.post('/api/queue/join', async (req: Request, res: Response) => {
  try {
    const { userId, groupId } = req.body;
    
    // Obter categoria no DB para descobrir o ID interno (groupCategoryId)
    const category = await prisma.groupCategory.findUnique({
        where: { groupId }
    });

    if (!category) {
        return res.status(404).json({ error: "Categoria de grupo não encontrada." });
    }

    // Passar para a regra de negócio ultra-crítica de filas
    const position = await joinQueue(userId, category.id);
    res.json({ success: true, position });
  } catch (err: any) {
    console.error('[HTTP] Erro ao entrar na fila:', err);
    res.status(500).json({ error: 'Erro interno ao processar alocação de Fila.' });
  }
});

/**
 * Frontend precisa exibir o QR Code em tela. O Frontend bate no nosso backend.
 * O Backend faz Proxy reverso (Axios) validado direto no Container 5 do WhatsApp API.
 */
app.post('/api/whatsapp/start', async (req: Request, res: Response) => {
    const { phoneId } = req.body; 
    // OBS: O Container 5 não usa nosso UUID, mas sim o número limpo que interage no WA (@c.us)
    // No contexto do delivery, "userId" referenciado muitas vezes no front refere-se a quem ele é no sistema final.
    // Garantimos que a chave que vai lá pro wweb.js seja um referencial único.
    
    try {
        const result = await requestWhatsappSession(phoneId);
        res.json(result);
    } catch(err) {
        res.status(500).json({ error: "Container 5 não suportou a requisição ou está offline." });
    }
});

app.get('/api/whatsapp/status/:phoneId', async (req: Request, res: Response) => {
    const { phoneId } = req.params;
    
    try {
        const result = await fetchSessionStatus(phoneId);
        res.json(result);
    } catch(err) {
        res.status(500).json({ error: "Falha na ponte HTTP." });
    }
});

app.post('/api/whatsapp/logout', async (req: Request, res: Response) => {
    const { phoneId } = req.body; 
    try {
        const result = await killWhatsappSession(phoneId);
        res.json(result);
    } catch(err) {
        res.status(500).json({ error: "Falha ao desvincular Sessão no Franco-Atirador." });
    }
});

// ===================================
// Endpoints de Operação de Corridas (In-Run)
// ===================================

app.get('/api/user/:userId/state', async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        
        // Em Corrida Ativa? (ignoramos os SETTLED)
        const activeDelivery = await prisma.deliveryRun.findFirst({
            where: { userId, status: { not: 'SETTLED' } },
            orderBy: { capturedAt: 'desc' }
        });

        if (activeDelivery) {
            return res.json({ status: 'in_run', delivery: activeDelivery });
        }

        // Em Fila?
        const queuePos = await prisma.queuePosition.findFirst({
            where: { userId }
        });

        if (queuePos) {
            return res.json({ status: 'in_queue', position: queuePos.orderIndex });
        }

        res.json({ status: 'idle' });
    } catch(e) {
        res.status(500).json({ error: 'Erro ao buscar estado logístico do banco de dados.' });
    }
});

app.post('/api/deliveries/:id/pickup', async (req: Request, res: Response) => {
    await prisma.deliveryRun.update({
        where: { id: req.params.id },
        data: { pickedUpAt: new Date(), status: 'IN_TRANSIT' }
    });
    res.json({ success: true, message: 'Pickup registrado.' });
});

app.post('/api/deliveries/:id/deliver', async (req: Request, res: Response) => {
    await prisma.deliveryRun.update({
        where: { id: req.params.id },
        data: { deliveredAt: new Date(), status: 'DELIVERED' }
    });
    res.json({ success: true, message: 'Delivery registrado.' });
});

app.post('/api/deliveries/:id/finish', async (req: Request, res: Response) => {
    const { deliveryValue, paymentMethod } = req.body;
    await prisma.deliveryRun.update({
        where: { id: req.params.id },
        data: { 
            returnedToBaseAt: new Date(), 
            status: 'SETTLED',
            deliveryValue: Number(deliveryValue),
            paymentMethod 
        }
    });
    res.json({ success: true, message: 'Ciclo Encerrado. Histórico salvo.' });
});

// Iniciador Assincrono da Aplicação Backend
async function bootstrap() {
    // 1. Iniciar O Redis Listener do Container 2 para escutar "run_taken" que vem do bot de tiro.
    initRedisSubscriber();

    // 2. Levantar Servidor HTTP do Container 2 (Backend Master)
    app.listen(PORT, () => {
        console.log(`
===========================================================
  QUEUEBOT V4 - BACKEND (Container 2)                      
  Status: Inicializado (Porta ${PORT})                       
  Funções: Router Central, Fila Mestre, Postgres Integrator
===========================================================`);
    });
}

bootstrap();
