# naPorta Orders API

API REST para gerenciamento de pedidos desenvolvida como parte do desafio técnico back-end da naPorta.

O projeto foi construído utilizando NestJS, PostgreSQL e Prisma, com foco em organização de código, boas práticas, segurança e facilidade de manutenção.

A aplicação conta com:

- autenticação JWT
- CRUD completo de pedidos
- soft delete
- filtros e paginação
- documentação Swagger
- testes automatizados
- ambiente Docker pronto para uso

---

# Tecnologias utilizadas

- **Node.js 20**
- **NestJS 11**
- **TypeScript 5**
- **PostgreSQL 16**
- **Prisma ORM**
- **JWT + Passport**
- **class-validator**
- **Swagger / OpenAPI**
- **Jest**
- **Docker + Docker Compose**

---

# Estrutura do projeto

A aplicação segue uma arquitetura em camadas para manter a separação de responsabilidades mais clara:

```txt
Controller -> Service -> Repository -> Prisma -> PostgreSQL
```

### Organização das camadas

| Camada | Responsabilidade |
|---|---|
| Controller | Entrada HTTP, validação e autenticação |
| Service | Regras de negócio |
| Repository | Comunicação com banco via Prisma |
| Common | Guards, filtros, decorators e utilitários compartilhados |

---

## Estrutura de pastas

```txt
src/
├── app.module.ts
├── main.ts
├── common/
├── config/
├── prisma/
└── modules/
    ├── auth/
    ├── users/
    └── orders/
```

---

# Pré-requisitos

Antes de iniciar o projeto, é necessário ter instalado:

- Node.js 20+
- npm 10+
- Docker + Docker Compose (recomendado)
- PostgreSQL 16 (caso rode sem Docker)

---

# Executando com Docker

```bash
cp .env.example .env

docker compose up -d --build

docker compose exec api npx prisma migrate deploy

docker compose exec api npm run db:seed
```

### Endpoints locais

| Serviço | URL |
|---|---|
| API | http://localhost:3000/api/v1 |
| Swagger | http://localhost:3000/api/docs |
| Health Check | http://localhost:3000/api/v1/health |

---

# Executando sem Docker

```bash
cp .env.example .env

npm install

npm run db:migrate

npm run db:seed

npm run start:dev
```

---

# Variáveis de ambiente

As variáveis ficam no arquivo `.env`.

Exemplo disponível em `.env.example`.

| Variável | Obrigatória | Descrição |
|---|---|---|
| NODE_ENV | não | Ambiente da aplicação |
| PORT | não | Porta da API |
| DATABASE_URL | sim | URL de conexão com PostgreSQL |
| JWT_SECRET | sim | Chave secreta do JWT |
| JWT_EXPIRES_IN | não | Tempo de expiração do token |

A aplicação valida as variáveis críticas no bootstrap para evitar subir com configuração incompleta.

---

# Rotas da API

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/v1/health` | Não | Health check |
| POST | `/api/v1/auth/register` | Não | Cadastro de usuário |
| POST | `/api/v1/auth/login` | Não | Login |
| POST | `/api/v1/orders` | Sim | Criar pedido |
| GET | `/api/v1/orders` | Sim | Listar pedidos |
| GET | `/api/v1/orders/:id` | Sim | Buscar pedido |
| PATCH | `/api/v1/orders/:id` | Sim | Atualizar pedido |
| DELETE | `/api/v1/orders/:id` | Sim | Remover pedido |

---

# Autenticação

As rotas protegidas utilizam JWT Bearer Token.

Header necessário:

```txt
Authorization: Bearer <token>
```

---

# Filtros disponíveis

Endpoint:

```txt
GET /api/v1/orders
```

| Parâmetro | Tipo | Exemplo |
|---|---|---|
| orderNumber | string | ORD-2026-000001 |
| status | enum | PENDING |
| startDate | date | 2026-01-01 |
| endDate | date | 2026-12-31 |
| page | number | 1 |
| limit | number | 20 |

---

# Estrutura das respostas

## Sucesso

```json
{
  "success": true,
  "data": {},
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

## Erro

```json
{
  "statusCode": 401,
  "timestamp": "2026-01-01T00:00:00.000Z",
  "path": "/api/v1/orders",
  "method": "GET",
  "message": "Unauthorized"
}
```

---

# Dados do seed

Após executar:

```bash
npm run db:seed
```

Será criado um usuário padrão:

```txt
Email: dev@naporta.com.br
Senha: senha123
```

Exemplo de login:

```bash
http POST :3000/api/v1/auth/login \
email=dev@naporta.com.br \
password=senha123
```

---

# Scripts úteis

| Script | Descrição |
|---|---|
| npm run start:dev | Ambiente de desenvolvimento |
| npm run build | Build da aplicação |
| npm run start:prod | Executa build de produção |
| npm test | Testes unitários |
| npm run test:cov | Cobertura de testes |
| npm run lint | ESLint |
| npm run format | Prettier |
| npm run db:generate | Prisma Client |
| npm run db:migrate | Executa migrations |
| npm run db:seed | Popula banco |
| npm run db:studio | Prisma Studio |

---

# Algumas decisões técnicas

### Soft delete

Foi utilizado `deletedAt` para manter histórico dos registros sem remover dados fisicamente do banco.

---

### Repository Pattern

A camada de repository foi utilizada para desacoplar a regra de negócio do ORM.

Isso facilita manutenção futura e possíveis trocas de tecnologia.

---

### Segurança

Algumas medidas implementadas:

- JWT com rotas protegidas por padrão
- bcrypt para hash de senha
- validação global com whitelist
- bloqueio de campos não permitidos
- mensagens genéricas no login para evitar enumeração de usuários

---

### Performance

Foram adicionados índices nos campos mais utilizados em filtros:

- `orderNumber`
- `status`
- `createdAt`
- `deletedAt`
- `userId`

---

# Testes

Os testes cobrem principalmente:

- criação de pedidos
- listagem com paginação
- soft delete
- autenticação
- login
- hash de senha

Todos os testes utilizam mocks, sem depender de banco real.

Executar:

```bash
npm test
```

---

# Diferenciais implementados

| Funcionalidade | Status |
|---|---|
| Arquitetura organizada | ✅ |
| Testes automatizados | ✅ |
| Docker | ✅ |
| Swagger | ✅ |
| Validação global | ✅ |
| Soft delete | ✅ |
| Paginação | ✅ |
| Filtros | ✅ |

---

# Melhorias futuras

Caso o projeto evoluísse para produção, alguns próximos passos seriam:

- testes E2E com Supertest
- refresh token
- rate limiting
- observabilidade e métricas
- pipeline CI/CD
- monitoramento
- logs estruturados
- OpenTelemetry
- GitHub Actions

---
