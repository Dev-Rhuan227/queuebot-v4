import { PrismaClient } from '@prisma/client';
import { publishNewTarget, publishWhitelist } from './redisService';

export const prisma = new PrismaClient();

/**
 * Registra um usuário no Banco como membro de uma fila, na última posição.
 * Se ele for o Posição 1 (primeiro a entrar), já ativa o gatilho "Franco-Atirador" via Redis.
 */
export async function joinQueue(userId: string, groupCategoryId: string) {
  // 1. Achar qual o maior orderIndex na fila desse grupo
  const lastInQueue = await prisma.queuePosition.findFirst({
    where: { groupCategoryId },
    orderBy: { orderIndex: 'desc' }
  });

  const nextOrderIndex = lastInQueue ? lastInQueue.orderIndex + 1 : 1;

  // 2. Inserir o user
  const newPosition = await prisma.queuePosition.create({
    data: {
      userId,
      groupCategoryId,
      orderIndex: nextOrderIndex
    },
    include: {
      groupCategory: true,
      user: {
        include: { whitelists: { include: { company: true } } }
      }
    }
  });

  console.log(`[QueueService] User ${newPosition.user.phoneId} entrou na fila do grupo ${newPosition.groupCategory.groupId} (Posição Virtual: ${nextOrderIndex})`);

  // 3. Se a fila estava vazia, armar o Container 5 instantaneamente
  if (nextOrderIndex === 1) {
    const groupId = newPosition.groupCategory.groupId;
    const phoneIdUser = newPosition.user.phoneId;
    
    // Lista de phoneIds das companies autorizadas por ele
    const whitelistPhoneIds = newPosition.user.whitelists.map(w => w.company.phoneId);

    // Dispara sinal pro Franco-Atirador armazenar na RAM O(1) local dele
    publishWhitelist(phoneIdUser, whitelistPhoneIds);
    publishNewTarget(groupId, phoneIdUser);
  }

  return newPosition;
}

/**
 * Escutador de callback: O Franco-Atirador avisou que essa pessoa
 * efetivamente atirou o 'Eu' e capturou a corrida (run_taken).
 * 
 * Precisamos: Remover ele da fila -> Criar DeliveryRun -> Achar quem é o #2 -> Promovê-lo a #1 e Armar o gatilho do #1.
 */
export async function handleRunTaken(phoneIdUser: string, groupId: string, companyPhoneId: string) {
  // Converte IDs do whatsapp para UUIDs da modelagem
  const user = await prisma.user.findUnique({ where: { phoneId: phoneIdUser } });
  const category = await prisma.groupCategory.findUnique({ where: { groupId } });
  const company = await prisma.company.findUnique({ where: { phoneId: companyPhoneId } });

  if (!user || !category || !company) {
      console.warn(`[QueueService] Erro lógico: Captura de um grupo/usuário não registrado. (${phoneIdUser} | ${groupId})`);
      return;
  }

  // 1. Apaga a Posição do campeão.
  await prisma.queuePosition.deleteMany({
    where: { 
      userId: user.id, 
      groupCategoryId: category.id 
    }
  });

  // 2. Cria o Lifecycle da Corrida com base no tempo atual
  await prisma.deliveryRun.create({
      data: {
          userId: user.id,
          companyId: company.id,
          status: 'CAPTURED'
      }
  });

  console.log(`[QueueService] Usuário ${phoneIdUser} decolou, DeliveryRun Criado e Operação iniciada!`);

  // 3. Busca quem é o próximo que encabeça a fila a partir de agora (menor orderIndex natural)
  const nextInLine = await prisma.queuePosition.findFirst({
    where: { groupCategoryId: category.id },
    orderBy: { orderIndex: 'asc' }, 
    include: {
      user: {
        include: { whitelists: { include: { company: true } } }
      }
    }
  });

  if (nextInLine) {
    const newTargetPhoneId = nextInLine.user.phoneId;
    const whitelistPhoneIds = nextInLine.user.whitelists.map(w => w.company.phoneId);

    console.log(`[QueueService] A Fila andou. Promovendo ${newTargetPhoneId} ao Posição 1.`);
    // Arma o Próximo
    publishWhitelist(newTargetPhoneId, whitelistPhoneIds);
    publishNewTarget(groupId, newTargetPhoneId);
  } else {
    // Passar `null` para o Redis limpa o array/boolean na memória RAM O(1) do Container 5
    console.log(`[QueueService] A Fila no grupo ${groupId} esvaziou.`);
    publishNewTarget(groupId, null);
  }
}
