# naPorta Orders API

API REST de gerenciamento de pedidos construída como resposta ao desafio técnico
back-end da naPorta. Implementa autenticação JWT, CRUD completo de pedidos com
soft delete, filtros, paginação, documentação Swagger, testes automatizados e
empacotamento Docker.

## Stack

- **Runtime:** Node.js 20 LTS
- **Framework:** NestJS 11 + TypeScript 5
- **Banco:** PostgreSQL 16
- **ORM:** Prisma 7
- **Autenticação:** JWT Bearer (passport-jwt)
- **Validação:** class-validator + class-transformer
- **Documentação:** Swagger / OpenAPI 3
- **Testes:** Jest
- **Infra:** Docker + Docker Compose

> **Por que essas escolhas?** O desafio indica NestJS, PostgreSQL e Prisma como
> preferenciais. Todos foram mantidos. Nenhuma justificativa adicional é
> necessária no README porque seguimos as opções recomendadas.

## Arquitetura

Clean Architecture enxuta, com separação explícita em camadas:

```
HTTP (Controller) -> Application (Service) -> Repository -> Prisma -> PostgreSQL
```

| Camada       | Responsabilidade                                                 |
|--------------|------------------------------------------------------------------|
| Controller   | Binding HTTP, validação de DTO, autorização                      |
| Service      | Regras de negócio, orquestração                                  |
| Repository   | Encapsula o Prisma — única camada que conhece o ORM              |
| Common       | Filtros, interceptors, guards, decorators e tipos compartilhados |

A inversão `Repository <- Service` permite substituir o Prisma sem mexer em
serviços/controllers. Os DTOs ficam isolados em cada módulo.

```
src/
├── app.module.ts            # Composição raiz
├── main.ts                  # Bootstrap (pipes, swagger, cors)
├── common/                  # filter, interceptors, guard, decorators, types
├── config/                  # configuration.ts tipado
├── prisma/                  # PrismaModule (global) + PrismaService
└── modules/
    ├── auth/                # AuthController + Service + JwtStrategy + DTOs
    ├── users/               # UsersService + Repository (usado pelo Auth)
    └── orders/              # OrdersController + Service + Repository + DTOs
```

## Pré-requisitos

- Node.js 20+
- npm 10+
- Docker + Docker Compose (opcional, recomendado)
- PostgreSQL 16 (caso não use Docker)

## Setup com Docker (recomendado)

```bash
cp .env.example .env
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
docker compose exec api npm run db:seed
```

- API: <http://localhost:3000/api/v1>
- Swagger: <http://localhost:3000/api/docs>
- Health: <http://localhost:3000/api/v1/health>

## Setup manual (sem Docker)

```bash
cp .env.example .env       # ajuste DATABASE_URL para o seu Postgres
npm install
npm run db:migrate         # cria as tabelas
npm run db:seed            # popula com 10 pedidos fictícios
npm run start:dev
```

## Variáveis de ambiente

Defina em `.env`. Exemplo em `.env.example`.

| Variável         | Obrigatória | Descrição                                                   |
|------------------|-------------|-------------------------------------------------------------|
| `NODE_ENV`       | não         | `development` (padrão) \| `production` \| `test`            |
| `PORT`           | não         | Porta HTTP (padrão `3000`)                                  |
| `DATABASE_URL`   | **sim**     | Connection string Postgres                                  |
| `JWT_SECRET`     | **sim**     | Segredo do JWT — use 32+ caracteres aleatórios em produção  |
| `JWT_EXPIRES_IN` | não         | Tempo de vida do token (padrão `15m`)                       |

A aplicação **falha rápido** no bootstrap se `DATABASE_URL` ou `JWT_SECRET`
estiverem ausentes — para evitar subir uma API silenciosamente quebrada.

## Endpoints

| Método | Rota                    | Auth | Descrição                       |
|--------|-------------------------|------|---------------------------------|
| GET    | `/api/v1/health`        | não  | Health check (app + DB)         |
| POST   | `/api/v1/auth/register` | não  | Cadastro de usuário             |
| POST   | `/api/v1/auth/login`    | não  | Login / obtenção de token       |
| POST   | `/api/v1/orders`        | sim  | Criar pedido                    |
| GET    | `/api/v1/orders`        | sim  | Listar/filtrar pedidos          |
| GET    | `/api/v1/orders/:id`    | sim  | Buscar pedido por ID            |
| PATCH  | `/api/v1/orders/:id`    | sim  | Atualizar pedido                |
| DELETE | `/api/v1/orders/:id`    | sim  | Exclusão lógica (soft delete)   |

Todas as rotas autenticadas exigem o header:

```
Authorization: Bearer <accessToken>
```

### Filtros em `GET /api/v1/orders`

| Parâmetro     | Tipo   | Exemplo            | Observação                         |
|---------------|--------|--------------------|------------------------------------|
| `orderNumber` | string | `ORD-2026-000001`  | Busca parcial, case-insensitive    |
| `status`      | enum   | `PENDING`          | `PENDING\|CONFIRMED\|IN_TRANSIT\|DELIVERED\|CANCELLED` |
| `startDate`   | ISO    | `2026-01-01`       | Inclusivo, aplicado em `createdAt` |
| `endDate`     | ISO    | `2026-12-31`       | Inclusivo, aplicado em `createdAt` |
| `page`        | number | `1`                | padrão `1`                         |
| `limit`       | number | `20`               | padrão `20`, máximo `100`          |

### Envelope das respostas

Todas as respostas com corpo são embrulhadas em:

```json
{
  "success": true,
  "data": <payload>,
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Erros seguem o padrão:

```json
{
  "statusCode": 401,
  "timestamp": "...",
  "path": "/api/v1/orders",
  "method": "GET",
  "message": "Unauthorized"
}
```

## Credenciais do seed

Após rodar `npm run db:seed`:

```
Email: dev@naporta.com.br
Senha: senha123
```

Exemplo de login (httpie):

```bash
http POST :3000/api/v1/auth/login email=dev@naporta.com.br password=senha123
```

## Scripts npm úteis

| Script                | Descrição                                |
|-----------------------|------------------------------------------|
| `npm run start:dev`   | Sobe a API em modo watch                 |
| `npm run build`       | Compila para `dist/`                     |
| `npm run start:prod`  | Roda o build de produção                 |
| `npm test`            | Roda testes unitários                    |
| `npm run test:cov`    | Roda testes com cobertura                |
| `npm run lint`        | ESLint com autofix                       |
| `npm run format`      | Prettier                                 |
| `npm run db:generate` | Gera o Prisma Client                     |
| `npm run db:migrate`  | Executa migrations em dev                |
| `npm run db:seed`     | Popula o banco com pedidos fictícios     |
| `npm run db:studio`   | Abre o Prisma Studio                     |

## Decisões técnicas

- **Soft delete** via `deletedAt` — preserva histórico, auditável e reversível.
- **Repository pattern** — isola o ORM da regra de negócio.
- **`Decimal` para preço** — evita erro de ponto flutuante em moeda.
- **Índices explícitos** em `orderNumber`, `status`, `createdAt`, `deletedAt`,
  `userId` — performance real em filtros.
- **Whitelist no `ValidationPipe`** com `forbidNonWhitelisted: true` — rejeita
  campos desconhecidos por padrão.
- **Mensagem genérica no login** ("Credenciais inválidas") — anti-enumeração
  de usuários (OWASP).
- **Bcrypt com 12 rounds** — recomendação atual da OWASP para senhas.
- **JWT global guard com `@Public()` opt-out** — segurança por padrão: novas
  rotas estão protegidas a menos que sejam explicitamente públicas.
- **Posse do recurso validada no service** — usuário só lista/edita/exclui
  seus próprios pedidos (`userId` no `where`); pedidos de terceiros retornam
  404 (não revela existência).
- **`ParseUUIDPipe`** nos `:id` — rejeita IDs malformados antes do banco.
- **Versionamento por URI** (`/api/v1/...`) — preparado para evoluções.
- **Swagger com Bearer auth persistido** — quem revisa testa direto no `/api/docs`.

## Testes

```bash
npm test
```

Os testes unitários cobrem `OrdersService` (criação, busca, paginação,
validação de datas e soft delete) e `AuthService` (registro, login, hashing
bcrypt e mensagens anti-enumeração) com mocks de repositório/JWT/config —
sem dependência de banco real.

## Bônus do desafio

| Item               | Status                                                              |
|--------------------|---------------------------------------------------------------------|
| Clean Code         | Sim — camadas, single responsibility, sem comentários supérfluos.   |
| Testes automáticos | Sim — unitários para `OrdersService` e `AuthService`.               |
| Docker             | Sim — `Dockerfile` multi-stage + `docker-compose.yml` com Postgres. |
| Linter             | Sim — ESLint 9 (flat config) + Prettier já configurados pelo CLI.   |
| Serverless         | Não implementado — exigia decisão de provider; preferi entregar a base sólida primeiro. |

## Próximos passos (se este fosse um projeto real)

- E2E com `supertest` cobrindo o fluxo `register -> login -> create -> list`.
- Refresh token / rotação de credenciais.
- Rate limiting (`@nestjs/throttler`) nas rotas de auth.
- Observabilidade (request id por header, métricas Prometheus, OpenTelemetry).
- Extrair `Customer` e `Address` para tabelas próprias quando o domínio crescer.
- Pipeline CI no GitHub Actions (lint + test + build).
