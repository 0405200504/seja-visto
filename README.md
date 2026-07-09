# Plano Pronto de Estilo

Plataforma premium de estilo masculino do expert **Raphael Pereira** — área de membros com método em módulos, lookbook com filtros, guarda-roupa essencial, plano de ação de 7 dias e painel administrativo.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Supabase (auth + banco + RLS) · Lucide Icons · Deploy-ready para Vercel.

---

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, execute na ordem:
   - `supabase/migrations/00001_schema.sql` — tabelas, triggers, funções e políticas RLS;
   - `supabase/migrations/00002_seed.sql` — 8 módulos, 37 aulas, 20 looks e 30 peças de guarda-roupa.
3. Em **Authentication → Providers → Email**, deixe o provider Email ativo.
   - Para testar sem e-mail de confirmação, desative **"Confirm email"** (recomendado em dev).
4. Em **Authentication → URL Configuration**, adicione:
   - Site URL: `http://localhost:3000` (e depois a URL de produção);
   - Redirect URLs: `http://localhost:3000/auth/callback`.
5. Copie a **URL** e a **anon key** em *Project Settings → API*.

### Tornar um usuário admin

Depois de criar sua conta pelo app, rode no SQL Editor:

```sql
update public.users_profile
set is_admin = true
where user_id = (select id from auth.users where email = 'seu@email.com');
```

O link **Admin** aparece na sidebar e a área `/admin` é liberada (protegida por RLS + verificação no servidor).

## 2. Rodar localmente

```bash
cp .env.local.example .env.local   # preencha com suas credenciais do Supabase
npm install
npm run dev                        # http://localhost:3000
```

Variáveis de ambiente:

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (pública) |
| `NEXT_PUBLIC_SITE_URL` | URL pública do app (links de e-mail) |

## 3. Deploy na Vercel

1. Suba o repositório para o GitHub e importe na Vercel.
2. Configure as 3 variáveis de ambiente acima (com `NEXT_PUBLIC_SITE_URL` apontando para o domínio de produção).
3. Adicione a URL de produção nas Redirect URLs do Supabase.

## 4. Estrutura

```
src/
├── app/
│   ├── (auth)/            # login, cadastro, recuperar-senha, nova-senha
│   ├── (app)/             # área logada com shell (sidebar + bottom nav)
│   │   ├── dashboard/     # saudação, progresso, recomendações
│   │   ├── metodo/        # módulos e aulas com progresso
│   │   ├── combinacoes/   # lookbook com filtros + detalhe do look
│   │   ├── guarda-roupa/  # peças essenciais ("já tenho" / "quero comprar")
│   │   ├── favoritos/     # looks salvos, plano e lista de compras
│   │   ├── plano-de-acao/ # desafio de 7 dias com anotações
│   │   └── perfil/        # dados, perfil de estilo, progresso, sair
│   ├── admin/             # CRUD de looks, módulos, aulas e peças + usuários
│   ├── onboarding/        # 3 perguntas que personalizam o app
│   ├── actions/           # server actions (auth, user, admin, onboarding)
│   └── auth/callback/     # troca de código de e-mail/OAuth por sessão
├── components/
│   ├── ui/                # design system (button, card, input, badge…)
│   ├── app/               # componentes da área de membros
│   └── admin/             # formulários do painel admin
├── lib/
│   ├── supabase/          # clients (browser, server, middleware)
│   ├── auth.ts            # requireUser / requireProfile / requireAdmin
│   ├── constants.ts       # taxonomias (ocasião, estilo, cores…) + plano de 7 dias
│   └── types.ts           # tipos do banco
└── middleware.ts          # sessão + proteção de rotas
```

## 5. Segurança

- Rotas protegidas por middleware + verificação de sessão no servidor.
- RLS em todas as tabelas: cada usuário só lê/edita os próprios dados.
- Conteúdo do produto legível apenas por usuários autenticados; escrita apenas por admin (função `is_admin()` security definer).
- Trigger impede que um usuário comum se promova a admin.
- Perfil criado automaticamente no cadastro (trigger em `auth.users`).

## 6. Próximos passos recomendados

- **Upload real de imagens** via Supabase Storage no admin (hoje usa URL + placeholders editoriais).
- **Assinatura/paywall**: integrar Stripe ou Hotmart para liberar acesso após compra.
- **Ícones PWA** dedicados (192/512px) e service worker para offline.
- **Notificações/e-mail** de lembrete do plano de 7 dias.
- **Analytics** de progresso por módulo no admin.
- Testes E2E (Playwright) dos fluxos de auth e onboarding.
