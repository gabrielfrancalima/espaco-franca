# Guia de Deploy — Espaço França

Este projeto tem duas partes que são publicadas **separadamente**:

- `backend/` — API em FastAPI + MongoDB (Motor) + Stripe
- `frontend/` — SPA em React (Create React App / Craco)

## O que já foi ajustado aqui

O backend original usava `emergentintegrations`, um pacote **privado** da
plataforma Emergent que não existe no PyPI público — por isso não instalava
fora do ambiente da Emergent. Ele foi substituído pelo SDK oficial `stripe`
(veja `backend/server.py`, seções `/checkout/session`, `/checkout/status/{id}`
e `/webhook/stripe`). O comportamento é o mesmo: sessão de pagamento único
(Checkout Session em modo `payment`), não assinatura recorrente.

**Atenção**: o login com Google no frontend (`AuthContext.jsx`) redireciona
para `auth.emergentagent.com`, um serviço de terceiro operado pela Emergent.
Isso deve continuar funcionando de onde quer que você hospede (é só uma URL
pública), mas é uma dependência fora do seu controle — se um dia parar de
responder, o login quebra. Se quiser independência total, me avise que
preparo a troca para OAuth do Google direto (Google Cloud Console).

---

## 1. Banco de dados — MongoDB Atlas (se ainda não tiver um)

1. Crie um cluster gratuito em https://www.mongodb.com/cloud/atlas
2. Crie um usuário de banco e libere o IP `0.0.0.0/0` (ou o IP do seu host) em Network Access
3. Copie a connection string (`MONGO_URL`)

## 2. Backend — Render (ou Railway/Fly.io, o processo é similar)

Arquivos já preparados: `backend/Procfile`, `render.yaml`, `backend/requirements.txt`

**Pelo dashboard do Render:**
1. New → Web Service → conecte seu repositório Git (suba esta pasta pro GitHub primeiro)
2. Root Directory: `backend`
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Em "Environment", adicione as variáveis (veja `backend/.env.example`):
   - `MONGO_URL`
   - `DB_NAME`
   - `CORS_ORIGINS` → coloque a URL do frontend depois de publicá-lo (ex: `https://seu-app.vercel.app`)
   - `STRIPE_API_KEY` → sua chave secreta do Stripe (`sk_live_...` ou `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` → veja o passo 4 abaixo
6. Deploy. Anote a URL gerada (ex: `https://espaco-franca-backend.onrender.com`)

Se preferir Railway: mesmo processo, usando `backend/Procfile`.

## 3. Frontend — Vercel

Arquivo já preparado: `frontend/vercel.json`

1. New Project → importe o repositório → Root Directory: `frontend`
2. Framework Preset: "Create React App" (o `vercel.json` já define build/output)
3. Environment Variables (veja `frontend/.env.example`):
   - `REACT_APP_BACKEND_URL` → a URL do backend do passo 2, **sem barra no final**
4. Deploy. Anote a URL gerada (ex: `https://espaco-franca.vercel.app`)
5. Volte no Render e atualize `CORS_ORIGINS` com essa URL, depois faça redeploy do backend.

## 4. Stripe — chave e webhook

1. No Dashboard do Stripe → Developers → API keys → copie a **Secret key** → `STRIPE_API_KEY`
2. Developers → Webhooks → Add endpoint:
   - URL: `https://SEU-BACKEND/api/webhook/stripe`
   - Eventos: `checkout.session.completed`, `checkout.session.async_payment_succeeded`
3. Copie o "Signing secret" (`whsec_...`) → variável `STRIPE_WEBHOOK_SECRET` no backend

## 5. Teste rápido pós-deploy

```
curl https://SEU-BACKEND/api/
# esperado: {"message": "Espaço França API", "status": "ok"}

curl https://SEU-BACKEND/api/plans
# esperado: lista de planos do clube
```

Depois abra o frontend, tente logar e simular um pagamento em modo teste do Stripe
(cartão `4242 4242 4242 4242`, qualquer data futura e CVC).

## Rodando localmente (opcional, antes de publicar)

```bash
# backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # preencha com valores reais
uvicorn server:app --reload --port 8000

# frontend (em outro terminal)
cd frontend
yarn install
cp .env.example .env   # REACT_APP_BACKEND_URL=http://localhost:8000
yarn start
```
