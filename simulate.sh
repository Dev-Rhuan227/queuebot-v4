#!/bin/bash

# =========================================================
# CONFIGURAÇÃO DO SEU TESTE (Altere os 3 valores abaixo!)
# =========================================================
USER_ID="5511999999999@c.us"        # O BOT (SEU NÚMERO LOGADO QUE VAI GANHAR A CORRIDA)
COMPANY_ID="5511888888888@c.us"     # O CLIENTE QUE VAI DISPARAR O STICKER
GROUP_ID="120363000000000000@g.us"  # O GRUPO AONDE A FIGURINHA VAI CAIR
# =========================================================

echo "🚀 [SIMULADOR] Iniciando injeção via Docker exec do Redis..."

echo "📡 1/2 Construindo matriz em RAM (empresa $COMPANY_ID)..."
docker exec queuebot_redis redis-cli PUBLISH updates_whitelist '{"userId":"'"$USER_ID"'","companies":["'"$COMPANY_ID"'"]}'

echo "📡 2/2 Elegendo Posição 1 no Grupo $GROUP_ID..."
docker exec queuebot_redis redis-cli PUBLISH updates_queue '{"groupId":"'"$GROUP_ID"'","userId":"'"$USER_ID"'"}'

echo "✅ EVENTOS INJETADOS COM SUCESSO! Mande o sticker e olho nos logs do Whatsapp-API!"
