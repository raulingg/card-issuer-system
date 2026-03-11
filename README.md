# NestJS Microservices Monorepo Boilerplate

A production-ready monorepo boilerplate for building event-driven microservices with NestJS, Kafka, and MongoDB.

## Tech Stack

| Layer      | Technology                  |
| ---------- | --------------------------- |
| Runtime    | Node.js 22                  |
| Framework  | NestJS (latest)             |
| Monorepo   | Turborepo 2                 |
| Messaging  | Kafka (KafkaJS)             |
| Database   | MongoDB (latest) + Mongoose |
| Validation | Zod                         |
| Linting    | ESLint 9 (flat config)      |
| Formatting | Prettier 3                  |
| Testing    | Jest + SWC                  |

---

## Project Structure

```
.
├── services/                     # Microservices (one folder per service)
│   ├── user-service/             # User domain (REST + Kafka)
│   └── notification-service/     # Notification consumer (Kafka-only)
│
├── libs/                         # Shared libraries (scope:lib)
│   ├── common/                   # Filters, interceptors, pipes, interfaces
│   ├── kafka/                    # KafkaModule, topics enum, interfaces
│   ├── database/                 # DatabaseModule, BaseRepository
│   └── config/                   # Zod env schemas, validateEnv()
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

- **`@libs/common`**: `HttpExceptionFilter`, `RpcExceptionFilter`, `LoggingInterceptor`, `TransformInterceptor`, `ZodValidationPipe`
- **`@libs/kafka`**: `KafkaModule.forRoot()`, `KafkaTopic` enum, message interfaces
- **`@libs/database`**: `DatabaseModule.forRoot()`, `BaseRepository<T>` abstract class
- **`@libs/config`**: Zod env schemas (`BaseEnvSchema`, `KafkaEnvSchema`, etc.), `validateEnv()`

### Event Flow

```
User Service  ──── user.created ────►  Notification Service

Notification  ──── notification.sent ──►  User Service
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
cp services/user-service/.env.example services/user-service/.env
cp services/notification-service/.env.example services/notification-service/.env

# Start all services (infrastructure + apps)
docker compose up --build

# Start with Kafka UI (http://localhost:8080)
docker compose --profile tools up --build
```

### Run locally (development)

```bash
# Start infrastructure only
docker compose up mongo zookeeper kafka -d

# Serve individual services (with hot reload)
npm run dev -- --filter=user-service
npm run dev -- --filter=notification-service
```

---

## Turbo Commands

```bash
# Build a service
npm run build -- --filter=user-service

# Build all services
npm run build

# Run tests
npm run test -- --filter=user-service
npm run test

# Lint
npm run lint -- --filter=user-service
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

### Users

| Method   | Path                | Description    |
| -------- | ------------------- | -------------- |
| `POST`   | `/api/v1/users`     | Create user    |
| `GET`    | `/api/v1/users`     | List users     |
| `GET`    | `/api/v1/users/:id` | Get user by ID |
| `PATCH`  | `/api/v1/users/:id` | Update user    |
| `DELETE` | `/api/v1/users/:id` | Delete user    |

### Health

| Method | Path                                  | Service      |
| ------ | ------------------------------------- | ------------ |
| `GET`  | `http://localhost:3001/api/v1/health` | User Service |

---

## Environment Variables

Each service validates its environment at startup using **Zod**. Missing or malformed variables will throw a descriptive error before the service starts.

See `.env.example` files in each service directory for required variables.

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
