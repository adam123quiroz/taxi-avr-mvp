# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AVR (Agent Voice Response) MVP - A taxi dispatch voice interaction system built with multiple containerized services that handle phone calls using OpenAI's Realtime API for speech-to-speech conversations.

**Technology Stack:**
- Backend: NestJS + TypeORM + PostgreSQL
- Telephony: Asterisk (network_mode: host)
- Speech-to-Speech: OpenAI Realtime API (via avr-sts-openai service)
- Orchestration: AVR Core service (Python-based)
- Infrastructure: Docker Compose

## Architecture

### Service Communication Flow
1. **Asterisk** receives incoming phone calls on host network
2. **AVR Core** (port 5001) orchestrates call flow and streams audio
3. **AVR STS OpenAI** (port 6030) handles speech-to-speech via OpenAI Realtime API
4. **NestJS Backend** (port 3000) receives webhooks and stores call data
5. **PostgreSQL** (port 5432) stores calls and transcripts

### Key Interactions
- AVR Core calls `/api/calls/webhook` for call lifecycle events
- AVR Core sends audio to avr-sts-openai at `http://avr-sts-openai:6030/audio-stream`
- All services (except Asterisk) communicate via `avr-network` bridge

## Development Commands

### Local Development (Mac/Windows)
⚠️ **IMPORTANTE**: El audio RTP NO funcionará correctamente en Docker Desktop para Mac debido a limitaciones de networking. Para desarrollo local con audio, desplegar en servidor Linux.

```bash
# Copy environment template
cp .env.example .env

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f avr-core

# Stop services
docker-compose down
```

### Production Deployment (Linux Server)
Para despliegue completo con audio funcionando, ver **[DEPLOY.md](DEPLOY.md)** para guía detallada.

**Resumen rápido:**
```bash
# 1. Configurar .env con variables de producción
cp .env.example .env
nano .env  # Configurar OPENAI_API_KEY, SERVER_IP, etc.

# 2. Desplegar al servidor
./deploy.sh usuario@ip_servidor

# 3. Configurar cliente SIP
# - Usuario: 1000
# - Contraseña: 1000
# - Servidor: IP_PUBLICA_DEL_SERVIDOR
# - Puerto: 5060 UDP
# - Codecs: Solo PCMU (ulaw) y PCMA (alaw)

# 4. Probar
# - Extensión 600: Echo test
# - Extensión 5001: IA con OpenAI
```

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Development mode with hot reload
npm run start:dev

# Build
npm run build

# Production mode
npm run start:prod
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it mvp-postgres psql -U avruser -d avrdb

# Run init.sql manually (if needed)
docker exec -i mvp-postgres psql -U avruser -d avrdb < init.sql
```

## Backend Structure

### Module Organization
- **CallsModule**: Main business logic for handling phone calls
  - `calls.controller.ts`: REST endpoints + webhook handler
  - `calls.service.ts`: Business logic for call lifecycle
  - `entities/`: TypeORM entities (Call, Transcript)
  - `dto/`: Data transfer objects for validation

### Configuration System
- Uses `@nestjs/config` with `configuration.ts` for typed configuration
- Environment files: `.env.local` (priority), `.env`
- Config loaded globally via `ConfigModule.forRoot({ isGlobal: true })`
- TypeORM configured via `forRootAsync` using ConfigService

### API Endpoints

**Webhook (POST /api/calls/webhook)**
- Receives events from AVR Core: `call_started`, `transcription`, `call_ended`, `error`
- Validates via WebhookEventDto

**REST API (GET /api/calls/...)**
- `GET /api/calls` - List recent calls (last 50)
- `GET /api/calls/stats` - Statistics (total, active, completed, avg duration)
- `GET /api/calls/:uuid` - Get call with transcripts
- `GET /api/calls/:uuid/transcripts` - Get call transcripts

### Database Schema

**calls table**
- `uuid` (unique): Call identifier from AVR Core
- `callerNumber`: Phone number
- `startTime`, `endTime`, `duration`
- `status`: 'active' | 'completed' | 'error'
- `metadata`: JSONB for flexible data storage

**transcripts table**
- `callUuid`: Foreign key to calls.uuid
- `text`: Transcription text
- `speaker`: 'user' | 'agent'
- `timestamp`: When spoken
- Cascade delete when call is removed

## Environment Variables

Required in `.env`:
```bash
OPENAI_API_KEY=sk-proj-xxx        # OpenAI API key for Realtime API
WEBHOOK_SECRET=xxx                 # Shared secret for webhook validation
DB_PASSWORD=xxx                    # PostgreSQL password
```

## Important Notes

### TypeORM Auto-sync
- `synchronize: true` only in development (controlled by NODE_ENV)
- Production should use migrations
- `init.sql` provides backup schema but TypeORM creates tables automatically

### CORS Configuration
- Controlled via `CORS_ENABLED` and `CORS_ORIGINS` env vars
- Default origins: `http://localhost:3000`

### Global Validation
- `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- All DTOs use `class-validator` decorators
- Automatic transformation enabled

### Docker Networking
- Asterisk uses `network_mode: host` to handle SIP traffic
- Other services use `avr-network` bridge for isolation
- Backend accessible at `http://backend:3000` within network
- External access via port mapping `3000:3000`

### Logging
- NestJS Logger used throughout with emojis for visual scanning
- Bootstrap shows key URLs on startup
- Service methods log events with context

## Testing Webhooks Locally

```bash
# Example webhook payload
curl -X POST http://localhost:3000/api/calls/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event": "call_started",
    "uuid": "test-call-123",
    "data": {
      "caller_number": "+56912345678"
    }
  }'
```