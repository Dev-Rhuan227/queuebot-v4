# 🎯 Benchmark Absoluto do Franco-Atirador
*Um guia de Teste de Vida para o Módulo de Alta Performance do QueueBot v4.*

Essa seção foi projetada para que você ponha à prova de fogo a capacidade bélica do seu Container 5 (Responsável exclusivo por monitorar as mensagens de grupo, sem consultar banco de dados, atuando unicamente via Memória RAM e Puppeteer Otimizado).

Nós vamos subir *apenas* a infraestrutura de linha de frente para testar se a latência te vence ou você vence ela.

---

### Instalação e Preparação

Antes de tudo, garanta que você instalou a pequena biblioteca de dependências no diretório root para executar o simulador com segurança na sua máquina/servidor onde fará o teste:

```bash
# Na raiz do projeto, instale o IORedis (O Cliente Redis)
npm install ioredis
```

---

### Passo 1: Erguer o Campo de Batalha (Isolado)

Não precisaremos do Frontend, nem do Backend (Cérebro Prisma) e nem do PostgreSQL para esse teste brutal. Vamos erguer apenas o Redis (O sangue da comunicação) e o Whatsapp-API (O fuzil).

Execute pelo terminal:

```bash
# Sobe apenas os serviços fundamentais para a blitz
docker-compose up -d redis whatsapp-api

# Opcional: Acompanhar os logs ao vivo pra ler o cronômetro!
docker-compose logs -f whatsapp-api
```

---

### Passo 2: Logando seu Aparelho Principal

Com o Container 5 rodando orgulhosamente, precisamos ler as iniciais da Autenticação.

Abra o seu Postman/Insomnia (ou até via curL) e rode esse pequeno disparo na porta que está exposta:

```http
POST http://localhost:3001/session/start
Content-Type: application/json

{
    "userId": "SEUTELEFONEAQUI@c.us"
}
```

E em seguida, fique pedindo o `GET http://localhost:3001/session/SEUTELEFONEAQUI@c.us/status` até a resposta cair pra `QR_CODE_READY`.
*(Como a UI está offline pra esse teste restrito, pegue a string base64 que voltar no JSON, cole em um decodificador online (https://codebeautify.org/base64-to-image-converter), aponte o celular e estará LOGADO).*

---

### Passo 3: Injetando a Simulação 

Abra o arquivo recém-criado na raiz do projeto: `simulate-redis.js`.

Altere as 3 constantes (Elas dizem quem deve ganhar de verdade):
1. `userId`: Deixe exatamente como o ID do Telefone que usou para logar lá em cima.
2. `companyId`: Coloque o ID da "Empresa Falsa" (Bote o ID de um segundo aparelho de celular *SEU* ou de alguém do convívio que tem internet das mais rápidas).
3. `groupId`: Coloque o ID de Grupo onde os stickers de pedido caem. (As numerações dos grupos tem o final `@g.us`).

Salve!

Agora aperte o gatilho fora do docker apenas para popular a RAM do container C5 silenciosamente:

```bash
node simulate-redis.js
```

---

### Passo 4: O Teste Definitivo!

- Pegue aquele *Segundo Celular* (ou peça pro seu amigo com o dedo mais rápido do Oeste).
- Com o olho na tela onde está passando os `logs -f whatsapp-api`.
- Peça para ele **MANDAR UM STICKER (Figurinha)** rápido no Grupo configurado.

O bot vai pular sobre a mensagem no momento imediato. Interceptar a resposta sem tráfego SQL e sem processamento extra-lixo. E cravará na sua tela o Log Vermelho do Benchmark.

Desafie essa latência.🚀
