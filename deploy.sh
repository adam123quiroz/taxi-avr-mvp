#!/bin/bash

# Script de despliegue para servidor Linux
# Uso: ./deploy.sh [usuario@servidor] [puerto_ssh] [ruta_clave_privada]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Despliegue AVR MVP ===${NC}"

# Verificar que se pasó el argumento del servidor
if [ -z "$1" ]; then
    echo -e "${RED}Error: Debes especificar el servidor${NC}"
    echo "Uso: ./deploy.sh usuario@ip_servidor [puerto_ssh] [ruta_clave_privada]"
    echo "Ejemplo: ./deploy.sh ubuntu@192.168.1.100 1022 ~/keys/private.pem"
    exit 1
fi

SERVER=$1
SSH_PORT=${2:-22}
SSH_KEY=${3:-""}

# Construir opciones SSH
SSH_OPTS="-p $SSH_PORT -o StrictHostKeyChecking=no"
if [ -n "$SSH_KEY" ]; then
    SSH_OPTS="$SSH_OPTS -i $SSH_KEY"
fi

# Verificar que existe .env
if [ ! -f .env ]; then
    echo -e "${RED}Error: No existe archivo .env${NC}"
    echo "Copia .env.example a .env y configura las variables"
    exit 1
fi

echo -e "${YELLOW}Verificando conexión SSH...${NC}"
ssh $SSH_OPTS -o ConnectTimeout=5 $SERVER "echo 'Conexión exitosa'" || {
    echo -e "${RED}Error: No se pudo conectar al servidor${NC}"
    exit 1
}

echo -e "${YELLOW}Creando directorio en servidor...${NC}"
ssh $SSH_OPTS $SERVER "mkdir -p ~/avr-mvp"

echo -e "${YELLOW}Copiando archivos al servidor...${NC}"
rsync -avz --progress \
    -e "ssh $SSH_OPTS" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'backend/dist' \
    --exclude 'backend/node_modules' \
    --exclude '*.log' \
    ./ $SERVER:~/avr-mvp/

echo -e "${YELLOW}Instalando Docker en servidor (si no está instalado)...${NC}"
ssh $SSH_OPTS $SERVER << 'ENDSSH'
# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "Instalando Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker instalado. Es necesario cerrar sesión y volver a conectar para que los cambios surtan efecto."
fi

# Verificar si Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi
ENDSSH

echo -e "${YELLOW}Configurando firewall...${NC}"
ssh $SSH_OPTS $SERVER << 'ENDSSH'
# Permitir puertos necesarios
sudo ufw allow 1022/tcp  # SSH (puerto personalizado)
sudo ufw allow 5060/udp  # SIP
sudo ufw allow 5060/tcp  # SIP
sudo ufw allow 10000:10020/udp  # RTP
sudo ufw allow 3000/tcp  # Backend (opcional, si quieres acceso externo)
echo "Firewall configurado"
ENDSSH

echo -e "${YELLOW}Iniciando contenedores en servidor...${NC}"
ssh $SSH_OPTS $SERVER << 'ENDSSH'
cd ~/avr-mvp
docker-compose down
docker-compose pull
docker-compose up -d
echo "Esperando a que los servicios inicien..."
sleep 10
docker-compose ps
ENDSSH

echo -e "${GREEN}=== Despliegue completado ===${NC}"
echo ""
echo -e "${YELLOW}Próximos pasos:${NC}"
echo "1. Obtén la IP pública del servidor: ssh $SERVER 'curl -s ifconfig.me'"
echo "2. Configura Linphone con esa IP pública"
echo "3. Prueba llamando a la extensión 600 (echo test)"
echo "4. Prueba llamando a la extensión 5001 (IA)"
echo ""
echo -e "${YELLOW}Comandos útiles:${NC}"
echo "- Ver logs: ssh $SERVER 'cd ~/avr-mvp && docker-compose logs -f'"
echo "- Reiniciar: ssh $SERVER 'cd ~/avr-mvp && docker-compose restart'"
echo "- Ver estado: ssh $SERVER 'cd ~/avr-mvp && docker-compose ps'"
