# 🎯 Benchmark Absoluto do Franco-Atirador
*Um guia de Teste de Vida para o Módulo de Alta Performance do QueueBot v4. Adaptado para execução nativa no Servidor (sem requerer Node ou NPM instalados na máquina host).*

Essa seção foi projetada para que você ponha à prova de fogo a capacidade bélica do seu Container 5 (Responsável exclusivo por monitorar as mensagens de grupo, atuando unicamente via Memória RAM).

---

### Passo 1: Erguer o Campo de Batalha (Isolado)

Não precisaremos do Frontend, nem do Backend (Cérebro Prisma) e nem do PostgreSQL para esse teste brutal. Vamos erguer apenas o Redis e o Whatsapp-API.

Execute pelo terminal do seu servidor:

```bash
# Sobe apenas os serviços fundamentais para a blitz
docker-compose up -d redis whatsapp-api

# Vamos deixar os logs abertos em uma aba para acompanhar a velocidade de resposta:
docker-compose logs -f whatsapp-api
```

---

### Passo 2: Logando seu Aparelho Principal

Em **OUTRA** aba do seu terminal SSH do servidor, dispare os comandos CURL abaixo para solicitar e verificar o QR Code de login, substituindo a parte `"userId": "SEUTELEFONEAQUI@c.us"` pelo seu número exato (Ex: `5511999999999@c.us`):

1. **Inicie a sessão**:
```bash
curl -X POST http://localhost:3005/session/start \
     -H "Content-Type: application/json" \
     -d '{"userId": "SEUTELEFONEAQUI@c.us"}'
```

2. **Pegue o QR Code**:
```bash
# Fique rodando este até aparecer a string gigante (que começa com 1@ ou 2@)
curl http://localhost:3005/session/SEUTELEFONEAQUI@c.us/status
```

*(Copie a gigantesca string que virá na variável `qr` (Exemplo: `2@PiQ...`), acesse um site criador de QR Code como o https://www.the-qrcode-generator.com/, clique em "Text/Free Text", cole essa string lá, e escaneie o código quadrado que vai aparecer na tela com seu WhatsApp do celular!)*

Quando o status mudar via Curl para `CONNECTED`, o bot está pronto.

---

### Passo 3: Injetando a Simulação 

Abra o arquivo auxiliar criado na raiz do seu projeto e edite os números de testes:
```bash
nano simulate.sh
```

Preencha as 3 variáveis no topo do arquivo (Seu número, número da empresa que enviará os stickers e ID do grupo) e **salve**.

Para simular o disparo de autorização da Fila na memória RAM, rode o script Bash (Pois ele roda via container Redis direto, não exigindo nada do seu servidor!):
```bash
bash simulate.sh
```

Logo após executar, você verá no terminal dos logs do Whatsapp-API o bot gritando que *"A Fila Foi Atualizada"*!

---

### Passo 4: O Teste Definitivo!

- Pegue o WhatsApp da *Empresa Cliente* e entre no Grupo mapeado.
- Deixe seu olho fixo na tela preta do servidor onde os logs (`logs -f`) estão rodando.
- **Mande UM STICKER (Figurinha)** de corrida no Grupo configurado.

O bot vai pular sobre a mensagem no momento imediato com sua RegEx, fará um Match O(1) com as suas permissões pré-carregadas pelo `simulate.sh` e executará o `reply` ultra-veloz. E cravará na sua tela o Log Vermelho do Benchmark de latência final.

Aproveite seus milissegundos. 🚀
