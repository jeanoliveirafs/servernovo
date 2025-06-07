# 🚀 Deploy no Portainer - Guia OrionDesign

## 📋 Pré-requisitos

### No Servidor VPS
- Docker Engine instalado
- Portainer instalado e configurado
- Acesso SSH ao servidor
- Pelo menos 2GB RAM livres
- 10GB espaço em disco

### Portas Necessárias
- `80` - HTTP (Nginx)
- `443` - HTTPS (Nginx) - opcional
- `3000` - Aplicação (interno)
- `3001` - Grafana
- `9090` - Prometheus

## 🔧 Passos de Deploy

### 1. **Preparar o Código**

```bash
# 1. Clonar/fazer upload do código para o servidor
scp -r ./sistema-bull user@seu-servidor:/opt/phantom-identity/

# 2. Conectar no servidor
ssh user@seu-servidor

# 3. Navegar para o diretório
cd /opt/phantom-identity
```

### 2. **Configurar Variáveis de Ambiente**

Criar arquivo `.env` na raiz:
```bash
# Configurações do Phantom Identity System
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Redis
REDIS_PASSWORD=suaSenhaRedisSegura123

# Grafana
GRAFANA_PASSWORD=suaSenhaGrafanaSegura123

# Domain (substitua pelo seu domínio)
DOMAIN=phantom.seudominio.com

# SSL (defina como true se tiver certificados)
SSL_ENABLED=false

# Configurações adicionais
CORS_ORIGIN=https://phantom.seudominio.com
```

### 3. **Deploy via Portainer UI**

#### 3.1 Acessar Portainer
1. Abrir navegador: `https://seu-servidor:9000`
2. Fazer login no Portainer
3. Selecionar o ambiente Docker

#### 3.2 Criar Stack
1. Menu lateral: **Stacks**
2. Botão: **+ Add stack**
3. Nome: `phantom-identity-system`

#### 3.3 Configurar Stack
**Método 1: Upload docker-compose.yml**
1. Selecionar **Upload**
2. Fazer upload do arquivo `docker-compose.yml`

**Método 2: Editor Web**
1. Selecionar **Web editor**
2. Copiar conteúdo do `docker-compose.yml`

#### 3.4 Configurar Variáveis
Na seção **Environment variables**, adicionar:
```
REDIS_PASSWORD=suaSenhaRedisSegura123
GRAFANA_PASSWORD=suaSenhaGrafanaSegura123
DOMAIN=phantom.seudominio.com
SSL_ENABLED=false
```

#### 3.5 Deploy
1. Clicar **Deploy the stack**
2. Aguardar o deploy concluir
3. Verificar se todos os containers estão rodando

### 4. **Deploy via Portainer CLI (Alternativo)**

```bash
# 1. Fazer deploy usando o script
chmod +x deploy.sh
./deploy.sh

# 2. Ou usando docker-compose diretamente
docker-compose up -d --build
```

## 🔍 Verificação Pós-Deploy

### 1. **Verificar Status dos Containers**
No Portainer:
1. **Stacks** → `phantom-identity-system`
2. Verificar se todos os 5 containers estão **running**:
   - `phantom-identity-app`
   - `phantom-redis`
   - `phantom-nginx`
   - `phantom-prometheus`
   - `phantom-grafana`

### 2. **Testar Endpoints**
```bash
# Health check geral
curl http://seu-servidor/health

# Status da aplicação
curl http://seu-servidor/api/status

# Prometheus métricas
curl http://seu-servidor:9090

# Grafana
curl http://seu-servidor:3001
```

### 3. **Verificar Logs**
No Portainer:
1. **Containers** → Selecionar container
2. **Logs** → Verificar se não há erros

## 🔧 Configurações Avançadas

### 1. **SSL/HTTPS (Recomendado para Produção)**

#### 1.1 Obter Certificado SSL
```bash
# Usando Certbot (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d phantom.seudominio.com
```

#### 1.2 Copiar Certificados
```bash
sudo cp /etc/letsencrypt/live/phantom.seudominio.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/phantom.seudominio.com/privkey.pem ./ssl/key.pem
sudo chown 1001:1001 ./ssl/*.pem
```

#### 1.3 Atualizar Configuração
```bash
# Editar .env
SSL_ENABLED=true
DOMAIN=phantom.seudominio.com

# Descomentar seção SSL no nginx.conf
```

### 2. **Configurar Domínio**

#### 2.1 DNS
Apontar domínio para IP da VPS:
```
A    phantom.seudominio.com    → IP_DA_VPS
```

#### 2.2 Atualizar nginx.conf
```nginx
server_name phantom.seudominio.com;
```

### 3. **Backup Automático**

Criar script de backup:
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/phantom-identity"

mkdir -p $BACKUP_DIR

# Backup Redis
docker run --rm -v phantom-identity_redis-data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/redis-$DATE.tar.gz -C /data .

# Backup configurações
tar czf $BACKUP_DIR/config-$DATE.tar.gz .env nginx.conf docker-compose.yml

# Limpeza (manter apenas últimos 7 dias)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Configurar cron:
```bash
# Executar backup diário às 2h
0 2 * * * /opt/phantom-identity/backup.sh
```

## 📊 Monitoramento

### 1. **Grafana Dashboards**
1. Acessar: `http://seu-servidor:3001`
2. Login: `admin` / `[GRAFANA_PASSWORD do .env]`
3. Importar dashboards pré-configurados

### 2. **Prometheus Métricas**
1. Acessar: `http://seu-servidor:9090`
2. Consultar métricas disponíveis:
   - `phantom_active_clients`
   - `phantom_websocket_connections_total`
   - `phantom_fingerprint_tests_total`

### 3. **Alertas (Opcional)**
Configurar alertas para:
- Alta utilização de CPU/memória
- Número excessivo de erros
- Containers não responsivos

## 🚨 Troubleshooting

### Problema: Container não inicia
```bash
# Verificar logs
docker-compose logs phantom-identity

# Verificar recursos
docker stats

# Reconstruir imagem
docker-compose build --no-cache phantom-identity
```

### Problema: Nginx não responde
```bash
# Verificar configuração
docker-compose exec nginx nginx -t

# Recarregar configuração
docker-compose exec nginx nginx -s reload
```

### Problema: Redis não conecta
```bash
# Verificar conexão
docker-compose exec redis redis-cli ping

# Verificar senha
docker-compose exec redis redis-cli -a $REDIS_PASSWORD ping
```

### Problema: Performance baixa
```bash
# Verificar recursos
htop
docker stats

# Verificar logs de erro
docker-compose logs | grep ERROR

# Otimizar configurações
# Reduzir número de workers do Nginx
# Ajustar limites do Redis
```

## 📞 Suporte OrionDesign

### Contatos
- **Suporte Técnico**: suporte@oriondesign.com
- **Documentação**: docs.oriondesign.com
- **Status Page**: status.oriondesign.com

### Informações para Suporte
Ao entrar em contato, forneça:
1. Versão do sistema
2. Logs relevantes
3. Configuração do ambiente
4. Passos para reproduzir o problema

---

## ✅ Checklist de Deploy

- [ ] VPS configurada com Docker
- [ ] Portainer instalado e funcionando
- [ ] Código enviado para servidor
- [ ] Arquivo `.env` configurado
- [ ] Stack criada no Portainer
- [ ] Todos os containers rodando
- [ ] Endpoints respondendo
- [ ] SSL configurado (se necessário)
- [ ] Domínio apontando corretamente
- [ ] Monitoramento funcionando
- [ ] Backup configurado
- [ ] Documentação revisada

**✨ Pronto! Seu sistema Phantom Identity está rodando em produção!** 