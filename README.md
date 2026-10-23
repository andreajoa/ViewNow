# ViewNow

**ViewNow** é uma aplicação SaaS de organização de vídeos e planejamento de divulgação, com visual inspirado em painéis de marketing digital e API própria. Suporta links públicos do Instagram, Facebook, TikTok e YouTube.

> **Importante:** ViewNow não fabrica visualizações, não usa botnets/proxies para simular espectadores e não altera métricas públicas. Os números de visualizações exibidos na biblioteca são cadastrados manualmente. Cliques nas páginas compartilhadas representam apenas interações internas com links, não visualizações reconhecidas pelas redes sociais.

## O que funciona

- Landing page, cadastro e login com Supabase Auth.
- Painel responsivo, armazenamento privado por usuário no Supabase com RLS.
- Validação dos links para Instagram, Facebook, TikTok e YouTube.
- Adicionar, editar e remover vídeos; título, visualizações informadas e meta.
- Página compartilhável por vídeo em \`/watch?id=UUID\`, com incorporação quando permitida pela plataforma ou link para abrir externamente.
- Registro de cliques em páginas compartilhadas, separado das métricas das plataformas.
- Admin ilimitado identificado no servidor por \`ADMIN_EMAIL\`.
- Planos Starter, Growth e Scale; assinatura e portal de gerenciamento Stripe.
- Webhook Stripe com verificação de assinatura e atualização do plano.
- API própria: \`GET /api/status\`, \`GET /api/videos\`, \`POST /api/videos\` com Bearer token do Supabase.
- Modo demonstração sem configuração, com \`localStorage\` (apenas no navegador).
- Build Vite/React pronto para importação na Vercel.

**Não implementado:** integração de anúncios, sincronização automática de métricas públicas, gestão de campanhas comerciais executáveis ou geração de visualizações. O modo de demonstração não tem servidor nem pagamentos reais. A prévia depende das restrições de incorporação de cada rede.

## Execução local

Requer Node.js 22 ou superior.

\`\`\`bash
npm ci
npm run dev
npm run build
npm test
\`\`\`

Acesse \`http://localhost:5173\` e selecione **Explorar demonstração**.

## Implantação Vercel + Supabase + Stripe

1. Importe o repositório GitHub na Vercel, framework **Vite**, build \`npm run build\` e diretório \`dist\`.
2. Crie um projeto Supabase. Em **SQL Editor**, execute \`supabase/schema.sql\` e habilite **Email Authentication**. Configure as URLs de autenticação e redirecionamento no Supabase.
3. Configure as variáveis de ambiente descritas em \`.env.example\` na Vercel. **Nunca** exponha \`SUPABASE_SERVICE_ROLE_KEY\`, \`STRIPE_SECRET_KEY\` ou \`STRIPE_WEBHOOK_SECRET\` como \`VITE_\`.
4. Na Stripe, configure produtos com preços **mensais** para cada plano e copie os IDs de preços (\`price_...\`) nas respectivas variáveis \`STRIPE_PRICE_*\`.
5. Cadastre o webhook Stripe \`https://SEU-DOMINIO/api/stripe-webhook\` com eventos \`checkout.session.completed\`, \`customer.subscription.created\`, \`customer.subscription.updated\` e \`customer.subscription.deleted\`. Configure \`STRIPE_WEBHOOK_SECRET\`.
6. Configure \`APP_URL\` com a URL HTTPS de produção.
7. Para acesso ilimitado, configure \`ADMIN_EMAIL\` no ambiente do servidor, cadastre uma conta pelo site com exatamente esse e-mail e faça login. O endpoint \`/api/admin\` valida a sessão antes de atribuir o papel administrador.
8. Faça redeploy após mudar variáveis e execute testes de cadastro, login, criação, Stripe em modo de teste e cancelamento.

**Segurança:** as chaves privadas nunca devem ir ao GitHub. Não use uma chave Stripe de produção até validar o fluxo em modo de teste. O painel apresenta preços **indicativos** e apenas cobra o que estiver configurado nos IDs de preços da conta Stripe. As capacidades por plano (20/100/500 vídeos) são efetivamente aplicadas no banco via trigger.

## API própria

Obtendo o token de sessão do Supabase Auth, use:

\`\`\`bash
curl -H "Authorization: Bearer SEU_JWT" https://SEU-DOMINIO/api/videos
\`\`\`

Para cadastrar:

\`\`\`bash
curl -X POST https://SEU-DOMINIO/api/videos \\
  -H "Authorization: Bearer SEU_JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Meu vídeo","url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ","current_views":10,"target_views":10000}'
\`\`\`

\`target_views\` é uma meta, **não** uma solicitação de visualizações geradas.

## Estrutura

- \`src/\`: aplicação React + Vite.
- \`api/\`: API própria serverless da Vercel.
- \`supabase/schema.sql\`: base de dados e políticas.
- \`tests/\`: testes locais.

## Painel de solicitação estilo SMM

O painel **Nova solicitação** segue a experiência de um catálogo de marketing digital: rede social, categoria, serviço, link do vídeo, meta de audiência, orçamento e envio.

- **Meus pedidos** lista solicitações gravadas no Supabase, com controle de acesso por usuário e visão administrativa.
- **Serviços** mostra opções para campanhas autorizadas em Meta Ads, Google Ads, TikTok Ads, estratégias orgânicas e revisão criativa.
- O administrador mantém a conta grátis com limite ilimitado de vídeos.
- O sistema não cobra automaticamente nem executa campanhas; as solicitações têm status inicial **Recebido** e dependem de um fluxo de operação de publicidade real a ser integrado.
- Não há venda nem geração de visualizações artificiais. As metas são objetivos, não entregas garantidas.

O banco do projeto já recebeu a migração de solicitações. Para replicar a estrutura em outro Supabase, execute \`supabase/schema.sql\` e depois \`supabase/campaign_requests.sql\`.
