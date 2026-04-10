/**
 * O Franco-Atirador: Variáveis em RAM, acesso constante O(1).
 * Isolamento total do Banco de Dados para latência zero.
 */

// Mapeia { groupId: usuarioIdDoPrimeiroDaFila }
const queues = {};

// Mapeia { usuarioId: Set('numero_empresa1', 'numero_empresa2') }
const whitelists = {};

const stateManager = {
    // ---- FILAS ----
    isUserPositionOne: (groupId, userId) => {
        return queues[groupId] === String(userId);
    },
    setPositionOne: (groupId, userId) => {
        queues[groupId] = String(userId);
    },
    removeQueue: (groupId) => {
        delete queues[groupId];
    },

    // ---- WHITELIST ----
    isCompanyWhitelisted: (userId, companyId) => {
        const uId = String(userId);
        if (!whitelists[uId]) return false;
        return whitelists[uId].has(companyId);
    },
    setWhitelist: (userId, companyIdsArray) => {
        const uId = String(userId);
        whitelists[uId] = new Set(companyIdsArray);
    },
    addCompanyToWhitelist: (userId, companyId) => {
        const uId = String(userId);
        if (!whitelists[uId]) {
            whitelists[uId] = new Set();
        }
        whitelists[uId].add(companyId);
    },

    debugState: () => {
        return {
            queues,
            whitelists: Object.fromEntries(
                Object.entries(whitelists).map(([userId, set]) => [userId, Array.from(set)])
            )
        };
    }
};

module.exports = stateManager;
