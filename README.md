# NestJS Microservices Monorepo Boilerplate

A production-ready monorepo boilerplate for building event-driven microservices with NestJS, Kafka, and MongoDB.

## Tech Stack

| Layer      | Technology                  |
| ---------- | --------------------------- |
| Runtime    | Node.js 22                  |
| Framework  | NestJS (latest)             |
| Monorepo   | Turborepo 2 🚀              |
| Messaging  | Kafka (KafkaJS)             |
| Database   | MongoDB (latest) + Mongoose |
| Validation | Zod                         |
| Linting    | ESLint                      |
| Formatting | Prettier                    |
| Testing    | Jest                        |

---

## Project Structure

```
.
├── services/                     # Microservices (one folder per service)
│   ├── card-issuer/              # Card issuer domain (REST + Kafka + MongoDB)
│   └── card-processor/           # Card processor domain (Kafka-only)
│
├── libs/                         # Shared libraries
│   ├── common/                   # Filters, interceptors, pipes, dto
│   ├── kafka/                    # KafkaModule, topics enum
│   ├── database/                 # DatabaseModule, BaseRepository
│   └── config/                   # ConfigModule, Zod env schemas, validateEnv()
│
├── docker/
│   └── mongo-init.js             # DB + index initialization
├── docker-compose.yml            # Production compose
├── docker-compose.override.yml   # Development overrides (auto-applied)
├── turbo.json
├── tsconfig.base.json
├── eslint.config.js
├── .prettierrc
└── .editorconfig
```

---

## Architecture

### Layer Architecture (per service)

```
Controller  ──►  Service  ──►  Repository  ──►  MongoDB
    │               │
    ▼               ▼
Kafka Consumer   Kafka Producer
```

Each service follows a strict layered architecture:

- **Controller**: HTTP routes & Kafka event handlers
- **Service**: Business logic, orchestration
- **Repository**: Data access (extends `BaseRepository`)
- **Schema**: Mongoose schema / document definition
- **DTO**: Zod schemas for runtime validation + TypeScript types

### Shared Libraries

- **`@libs/common`**: `HttpExceptionFilter`, `LoggingInterceptor`, `ZodValidationPipe`
- **`@libs/kafka`**: `KafkaModule.forRootAsync()`, `KafkaTopic` enum, message interfaces
- **`@libs/database`**: `DatabaseModule.forRootAsync()`, `BaseRepository<T>` abstract class
- **`@libs/config`**: `AppConfigModule.forRoot()`, Zod env schemas (`BaseEnvSchema`, `KafkaEnvSchema`, etc.), `validateEnv()`

### Event Flow

```
Card Issuer  ──── io.card.requested.v1 ────►  Card Processor

Card Processor  |──── io.card.issued.v1          ──►  Card Issuer
                |──── io.card.requested.v1.dlq   ──►  Card Issuer
```

---

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose

### Install dependencies

```bash
npm install
```

### Run with Docker (recommended)

```bash
# Copy env files
cp .env.example .env
cp services/card-issuer/.env.example services/card-issuer/.env
cp services/card-processor/.env.example services/card-processor/.env

# Start all services (infrastructure + apps)
docker compose up --build

# Start with Kafka UI (http://localhost:8080)
docker compose --profile tools up --build
```

Note: local runs are not supported yet. There's a pending setup for that 😬

---

## Turbo Commands

```bash
# Build a service
npm run build -- --filter=card-issuer

# Build all services
npm run build

# Run tests
npm run test -- --filter=card-issuer
npm run test

# Lint
npm run lint -- --filter=card-issuer
npm run lint
```

---

## Adding a New Service

1. Create the service folder:

   ```
   services/my-service/
   ├── src/
   │   ├── modules/
   │   ├── app.module.ts
   │   └── main.ts
   ├── Dockerfile
   ├── package.json
   ├── nest-cli.json
   ├── tsconfig.json
   ├── jest.config.ts
   └── .env.example
   ```

2. Add Kafka topics to `libs/kafka/src/kafka.topics.ts`

3. Add service to `docker-compose.yml`

---

## API Endpoints

### Card Issuer service

| Method | Path                  | Description |
| ------ | --------------------- | ----------- |
| `POST` | `/api/v1/cards/issue` | Create user |

### Health

| Method | Path                                  | Service     |
| ------ | ------------------------------------- | ----------- |
| `GET`  | `http://localhost:3001/api/v1/health` | Card Issuer |

---

## Environment Variables

Each service validates its environment at startup using **Zod**. Missing or malformed variables will throw a descriptive error before the service starts.

See `.env.example` files in each service directory for required variables.

---

## Manual / Integration Verification

> Requires Docker running.

1. Start infrastructure

  ```bash
  docker compose up -d mongo zookeeper kafka
  ```

1. Install dependencies

  ```bash
  npm install
  ```

1. Start both services in dev mode

  ```bash
  npm run dev
  ```

  turbo will start `card-issuer` on `:3001` and `card-processor`

1. **Happy path — issue a card:**

  ```bash
  curl -X POST http://localhost:3002/api/v1/cards/issue \
    -H "Content-Type: application/json" \
    -d '{
      "customer": { "documentType": "DNI", "documentNumber": "11654321", "fullName": "Jose Perez", "age": 25, "email": "jose@example.com" },
      "product": { "type": "VISA", "currency": "PEN" },
      "forceError": false
    }'
  # Expected: { "requestId": "<uuid>", "status": "PENDING" }
  ```

1. **Verify duplicate rejection**

  ```bash
  # Same request again → 409 Conflict
  ```

1. **Force error / DLQ path:**

  ```bash
  curl -X POST http://localhost:3002/api/v1/cards/issue \
    -d '{ ..., "forceError": true }'
  # Observe card-processor logs: 3 retries then DLQ publish
  ```

1. **Monitor Kafka topics (optional: Kafka UI):**

  ```bash
  docker compose --profile tools up -d kafka-ui
  # Open http://localhost:8080 → inspect io.card.requested.v1, io.cards.issued.v1, io.card.requested.v1.dlq
  ```

---

## Docker Best Practices Applied

- Multi-stage builds (deps → builder → runner)
- Non-root user (`nestjs:nodejs`)
- Layer caching optimized (copy `package.json` before source)
- `HEALTHCHECK` on all services
- `restart: unless-stopped` in compose
- Named volumes for data persistence
- Separate `backend` and `kafka-net` networks
- `docker-compose.override.yml` for dev (auto-applied, gitignored in production)
- `profiles` for optional tooling (Kafka UI)
