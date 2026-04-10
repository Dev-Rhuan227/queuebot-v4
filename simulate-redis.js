const Redis = require('ioredis');

// Conecta ao Redis via localhost.
// Pré-requisito: O container Redis do docker-compose deve estar rodando e expondo a porta 6379 
const publisher = new Redis({
  host: 'localhost', 
  port: 6379,
});

async function runMock() {
    console.log("🚀 [SIMULADOR] Iniciando injeção paralela no Redis...");

    // CONFIGURAÇÃO DO SEU TESTE (Altere se necessário)
    // =========================================================
    const userId = "5511999999999@c.us"; // TELEFONE DE QUEM VAI DAR O LOGIN (O SEU)
    const companyId = "5511888888888@c.us"; // TELEFONE DE QUEM VAI MANDAR O STICKER
    const groupId = "120363000000000000@g.us"; // O GRUPO AONDE VÃO MANDAR O STICKER
    // (Dica: copie o ID real que aparecer nos logs do whatsapp-api se você não souber o ID do grupo)
    // =========================================================

    // 1. Armar Gatilho: Inserir a Whitelist Pessoal (O(1))
    console.log(`\n📡 1/2 [Pub/Sub] Construindo matriz em RAM (empresa ${companyId}) pro Usuário ${userId}...`);
    publisher.publish('updates_whitelist', JSON.stringify({ 
        userId: userId, 
        companies: [companyId] 
    }));

    // 2. Definir o Usuário como Posição 1 no Grupo de Delivery (O(1))
    console.log(`📡 2/2 [Pub/Sub] Elegendo ele como Vencedor Privilegiado na fila do Grupo ${groupId}...`);
    publisher.publish('updates_queue', JSON.stringify({ 
        groupId: groupId, 
        userId: userId 
    }));

    console.log("\n✅ [SIMULADOR] Eventos propagados pelo Barramento Redis!");
    console.log("\n============================================================");
    console.log("🎯 ESTADO ATUAL:");
    console.log(" O Container 5 agora 'acha' que o seu bot logado é dono de tudo.");
    console.log(" Mande a Empresa mandar UM ÚNICO STICKER lá no grupo pelo WhatsApp.");
    console.log(" E assista aos milissegundos da latência no console do Container 5!");
    console.log("============================================================\n");
    
    // Libera o CLI
    setTimeout(() => { 
        publisher.quit(); 
        process.exit(0); 
    }, 500);
}

runMock().catch((err) => {
    console.error("Ops, o Redis está offline? Execute o docker-compose primeiro.", err);
    process.exit(1);
});
