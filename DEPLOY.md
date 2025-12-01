# Guía de Despliegue - AVR MVP en Servidor Linux

## Requisitos Previos

- Servidor Linux (Ubuntu 20.04+ recomendado)
- Acceso SSH al servidor
- IP pública del servidor
- Docker y Docker Compose (se instalarán automáticamente si no están)

## Pasos de Despliegue

### 1. Preparar Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
cp .env.example .env
nano .env
```

Configura las siguientes variables:
- `OPENAI_API_KEY`: Tu API key de OpenAI
- `WEBHOOK_SECRET`: Un secreto seguro para webhooks
- `DB_PASSWORD`: Contraseña para PostgreSQL
- `SERVER_IP`: IP pública de tu servidor Linux

### 2. Ejecutar Script de Despliegue

```bash
./deploy.sh usuario@ip_servidor
```

Ejemplo:
```bash
./deploy.sh ubuntu@203.0.113.45
```

Este script:
1. Verifica la conexión SSH
2. Copia los archivos al servidor
3. Instala Docker y Docker Compose si es necesario
4. Configura el firewall (UFW)
5. Inicia todos los contenedores

### 3. Verificar Despliegue

```bash
ssh usuario@ip_servidor 'cd ~/avr-mvp && docker-compose ps'
```

Deberías ver todos los servicios en estado "Up":
- mvp-asterisk
- mvp-avr-core
- mvp-sts-openai
- mvp-backend
- mvp-postgres

### 4. Configurar Cliente SIP (Linphone)

En tu cliente SIP (Linphone en celular o desktop):

1. **Usuario**: 1000
2. **Contraseña**: 1000
3. **Dominio/Servidor**: IP_PUBLICA_DEL_SERVIDOR
4. **Puerto**: 5060
5. **Transporte**: UDP
6. **Codecs habilitados**: Solo PCMU (ulaw) y PCMA (alaw)

### 5. Probar Conexión

#### Echo Test (Extensión 600)
1. Marca 600 desde Linphone
2. Deberías escuchar tu propia voz con eco
3. Esto confirma que el audio RTP está funcionando

#### Test con IA (Extensión 5001)
1. Marca 5001 desde Linphone
2. Deberías escuchar al asistente de IA (OpenAI)
3. Habla con el asistente
4. Verifica que la conversación fluya correctamente

## Comandos Útiles

### Ver Logs en Tiempo Real
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose logs -f'
```

### Ver Logs de Asterisk
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose logs -f asterisk'
```

### Ver Logs de AVR Core
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose logs -f avr-core'
```

### Reiniciar Servicios
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose restart'
```

### Reiniciar Solo Asterisk
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose restart asterisk'
```

### Acceder a CLI de Asterisk
```bash
ssh usuario@servidor 'docker exec -it mvp-asterisk asterisk -rvvv'
```

Comandos útiles en Asterisk CLI:
- `pjsip show endpoints` - Ver endpoints registrados
- `pjsip show contacts` - Ver contactos activos
- `core show channels` - Ver llamadas activas
- `rtp set debug on` - Activar debug de RTP

### Detener Todo
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose down'
```

### Actualizar Código
```bash
./deploy.sh usuario@ip_servidor
```
(El script hace rsync y reinicia los contenedores)

## Troubleshooting

### No se registra el cliente SIP
1. Verificar que el puerto 5060 esté abierto en el firewall
2. Verificar logs de Asterisk: `docker-compose logs asterisk`
3. Verificar que usas la IP pública correcta
4. Verificar que el puerto UDP 5060 no esté bloqueado por el proveedor

### No hay audio en las llamadas
1. Verificar que los puertos RTP (10000-10020) estén abiertos
2. Activar debug RTP en Asterisk: `rtp set debug on`
3. Verificar que solo usas codecs ulaw/alaw
4. Verificar NAT/firewall del cliente

### Error de conexión con OpenAI
1. Verificar que `OPENAI_API_KEY` esté configurada en `.env`
2. Verificar logs: `docker-compose logs avr-sts-openai`
3. Verificar conectividad desde el servidor: `curl https://api.openai.com`

### Base de datos no inicia
1. Verificar logs: `docker-compose logs postgres`
2. Verificar que no haya otro servicio usando el puerto 5432
3. Eliminar volumen y recrear: `docker-compose down -v && docker-compose up -d`

## Puertos Utilizados

- **5060** (TCP/UDP): SIP signaling
- **10000-10020** (UDP): RTP media (audio)
- **3000** (TCP): Backend NestJS API
- **5432** (TCP): PostgreSQL (interno, no necesita ser público)
- **5001** (TCP): AVR Core (interno)
- **6030** (TCP): OpenAI STS (interno)

## Seguridad

### Recomendaciones:
1. Cambiar las contraseñas por defecto (usuario 1000, DB, webhook secret)
2. Configurar firewall solo para permitir puertos necesarios
3. Usar certificados TLS para SIP (PJSIP TLS)
4. Limitar acceso SSH por IP si es posible
5. Mantener Docker y sistema operativo actualizados

### Cambiar Contraseña SIP:
Editar `asterisk/pjsip.conf` en el servidor:
```bash
ssh usuario@servidor 'nano ~/avr-mvp/asterisk/pjsip.conf'
```

Buscar la sección:
```ini
[1000]
type=auth
auth_type=userpass
password=1000  # <-- Cambiar aquí
username=1000
```

Luego reiniciar:
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose restart asterisk'
```

## Monitoreo

### Ver Estado de Contenedores
```bash
ssh usuario@servidor 'cd ~/avr-mvp && docker-compose ps'
```

### Ver Uso de Recursos
```bash
ssh usuario@servidor 'docker stats'
```

### Ver Llamadas Activas
```bash
ssh usuario@servidor 'docker exec mvp-asterisk asterisk -rx "core show channels"'
```

### Ver Registro de Llamadas en DB
```bash
ssh usuario@servidor 'docker exec -it mvp-postgres psql -U avruser -d avrdb -c "SELECT * FROM call_logs ORDER BY created_at DESC LIMIT 10;"'
```
