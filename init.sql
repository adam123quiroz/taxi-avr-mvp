-- Este archivo se ejecuta automáticamente al crear el contenedor
-- TypeORM crea las tablas, pero esto es un backup

CREATE TABLE IF NOT EXISTS calls (
                                     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid VARCHAR(255) UNIQUE NOT NULL,
    "callerNumber" VARCHAR(50),
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP,
    duration INTEGER,
    status VARCHAR(20) DEFAULT 'active',
    metadata JSONB,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
    );

CREATE TABLE IF NOT EXISTS transcripts (
                                           id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "callUuid" VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    speaker VARCHAR(20) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY ("callUuid") REFERENCES calls(uuid) ON DELETE CASCADE
    );

CREATE INDEX idx_calls_uuid ON calls(uuid);
CREATE INDEX idx_calls_status ON calls(status);
CREATE INDEX idx_transcripts_call ON transcripts("callUuid");
