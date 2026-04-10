const crypto = require('crypto');
const Redis = require('ioredis');

// Para testes locais ou uso via docker
const REDIS_HOST = process.env.REDIS_HOST || 'redis';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// O Container vai usar 2 conexões distintas (boa prática do Redis para Pub/Sub)
const publisher = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
});

const subscriber = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
});

subscriber.on('connect', () => console.log('[Redis] Subscriber conectado! O Franco-Atirador está na escuta de atualizações.'));
publisher.on('connect', () => console.log('[Redis] Publisher conectado! O Franco-Atirador está pronto para anunciar capturas.'));

subscriber.on('error', (err) => console.error('[Redis] Erro no Subscriber:', err));
publisher.on('error', (err) => console.error('[Redis] Erro no Publisher:', err));

module.exports = {
    publisher,
    subscriber
};
