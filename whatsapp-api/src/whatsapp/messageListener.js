const memoryState = require('../state/memoryState');
const { publisher } = require('../redis/redisClient');
const { performance } = require('perf_hooks');

module.exports = function configureMessageListener(client, userId) {
    client.on('message', async (msg) => {
        const startTime = performance.now(); // ⏱️ DISPARO DO CRONÔMETRO!

        // [Filtro 0] Blindagem Extrema: Retorna instantaneamente se não for um sticker!
        // Ignora totalmente texto, áudio, vídeos gerando zero latência para esses eventos irrelevantes
        if (msg.type !== 'sticker') return;

        // Verifica se veio de um grupo.
        // O.B.S: Como é uma promise no wweb.js, fazemos isso após a checagem rápida (O(1)) do sticker.
        const chat = await msg.getChat().catch(() => null);
        if (!chat || !chat.isGroup) return;

        // O remetente original fica em msg.author em mensagens de grupo
        // O Id do grupo em si fica em msg.from
        const groupId = msg.from; 
        const senderId = msg.author || msg.from; 

        // DEBUG TEMPORÁRIO DE IDENTIFICADORES:
        console.log(`\n🕵️ [DEBUG DE STICKER] Temos um sticker num grupo!`);
        console.log(`🕵️ ID Real do Grupo recebido: ${groupId}`);
        console.log(`🕵️ ID Real de quem enviou: ${senderId}`);
        
        const checkPos = memoryState.isUserPositionOne(groupId, userId);
        const checkWhite = memoryState.isCompanyWhitelisted(userId, senderId);
        
        console.log(`🕵️ O Bot (${userId}) é o Top 1 do grupo? -> ${checkPos}`);
        console.log(`🕵️ A pessoa (${senderId}) está na whitelist? -> ${checkWhite}`);

        // [Filtro 1] RAM Check: O usuário desta sessão é o Número 1 na fila deste grupo?
        if (!checkPos) return;

        // [Filtro 2] RAM Check: A empresa que mandou a msg está na Whitelist deste usuário?
        if (!checkWhite) return;

        // [Ação] Tudo validado em tempo real (O(1)). Capturar a corrida!
        try {
            // Cita a mensagem recebida respondendo "Eu"
            await msg.reply("Eu");
            
            const endTime = performance.now(); // 🛑 TRAVAMENTO DO CRONÔMETRO!

            // Avisa imediatamente o Backend via emissão Redis Pub/Sub
            // O Backend cuidará de retirar esse usuário da fila globalmente e gravar no postgres
            publisher.publish('run_taken', JSON.stringify({
                userId,
                groupId,
                companyId: senderId,
                timestamp: Date.now()
            }));

            console.log(`⚡ [SNIPER MODE] Corrida capturada! UserId: ${userId} -> Empresa: ${senderId} -> Grupo: ${groupId}`);
            console.log(`\n======================================================`);
            console.log(`⏱️  [BENCHMARK] Tempo real de reação: ${(endTime - startTime).toFixed(3)} ms`);
            console.log(`======================================================\n`);
        } catch (error) {
            console.error(`[ERRO] Falha ao capturar corrida. UserId: ${userId}. Erro:`, error);
        }
    });
};
