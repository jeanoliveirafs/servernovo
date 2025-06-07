#!/bin/bash

# Script de Deploy Phantom Identity System
# Para uso com Portainer na VPS da OrionDesign

set -e

echo "🚀 Iniciando deploy do Phantom Identity System..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    error "Docker não está instalado!"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose não está instalado!"
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    log "Criando arquivo .env..."
    cat > .env << EOF
# Configurações do Phantom Identity System
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis
REDIS_PASSWORD=phantom123_$(openssl rand -hex 8)

# Grafana
GRAFANA_PASSWORD=admin123_$(openssl rand -hex 8)

# Domain (altere para seu domínio)
DOMAIN=localhost

# SSL (defina como true se tiver certificados)
SSL_ENABLED=false
EOF
    success "Arquivo .env criado!"
else
    warning "Arquivo .env já existe, mantendo configurações..."
fi

# Criar diretórios necessários
log "Criando diretórios necessários..."
mkdir -p logs data ssl monitoring/grafana

# Parar containers se estiverem rodando
log "Parando containers existentes..."
docker-compose down || true

# Build da aplicação
log "Construindo imagem da aplicação..."
docker-compose build --no-cache

# Iniciar serviços
log "Iniciando serviços..."
docker-compose up -d

# Aguardar serviços ficarem prontos
log "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar saúde dos serviços
log "Verificando saúde dos serviços..."

# Verificar aplicação principal
if curl -f http://localhost:3000/api/status > /dev/null 2>&1; then
    success "✅ Phantom Identity App está rodando!"
else
    error "❌ Phantom Identity App não respondeu!"
fi

# Verificar Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    success "✅ Redis está rodando!"
else
    warning "⚠️  Redis pode não estar respondendo"
fi

# Verificar Nginx
if curl -f http://localhost/health > /dev/null 2>&1; then
    success "✅ Nginx está rodando!"
else
    warning "⚠️  Nginx pode não estar respondendo"
fi

# Mostrar status dos containers
log "Status dos containers:"
docker-compose ps

# Mostrar informações de acesso
echo ""
echo "================================================"
success "🎉 Deploy concluído com sucesso!"
echo "================================================"
echo ""
echo "📊 Dashboard Principal: http://localhost"
echo "🔧 API Status: http://localhost/api/status"
echo "📈 Prometheus: http://localhost:9090"
echo "📊 Grafana: http://localhost:3001"
echo ""
echo "🔐 Credenciais (verifique o arquivo .env):"
echo "   - Grafana Admin: admin / [verifique GRAFANA_PASSWORD no .env]"
echo "   - Redis: [verifique REDIS_PASSWORD no .env]"
echo ""
echo "📝 Para ver os logs:"
echo "   docker-compose logs -f phantom-identity"
echo ""
echo "🛑 Para parar o sistema:"
echo "   docker-compose down"
echo ""
echo "🔄 Para reiniciar:"
echo "   docker-compose restart"
echo ""

# Mostrar comandos úteis
cat << 'EOF'
📚 Comandos úteis:

# Ver logs em tempo real
docker-compose logs -f

# Entrar no container da aplicação  
docker-compose exec phantom-identity sh

# Reiniciar apenas a aplicação
docker-compose restart phantom-identity

# Atualizar apenas a aplicação
docker-compose up -d --build phantom-identity

# Backup dos dados
docker run --rm -v sistema-bull_redis-data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/redis-backup-$(date +%Y%m%d_%H%M%S).tar.gz -C /data .

# Restaurar backup
docker run --rm -v sistema-bull_redis-data:/data -v $(pwd)/backup:/backup alpine tar xzf /backup/redis-backup-YYYYMMDD_HHMMSS.tar.gz -C /data

EOF

echo "✨ Sistema pronto para uso!" 