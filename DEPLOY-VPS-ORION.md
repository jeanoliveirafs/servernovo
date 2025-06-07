# 🚀 Deploy VPS → Portainer Orion Design - Guia Completo

## 🎯 **PASSO A PASSO COMPLETO PARA DEPLOY**

---

## 📋 **ETAPA 1: CONECTAR NA VPS**

### **1.1 Acesso SSH:**
```bash
# Conectar na sua VPS
ssh usuario@ip-da-vps

# Ou se usar porta específica:
ssh -p 2222 usuario@ip-da-vps
```

### **1.2 Atualizar Sistema:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y

# CentOS/Rocky
sudo yum update -y
```

---

## 📥 **ETAPA 2: BAIXAR PROJETO DO GITHUB**

### **2.1 Instalar Git (se necessário):**
```bash
# Ubuntu/Debian
sudo apt install git -y

# CentOS/Rocky  
sudo yum install git -y
```

### **2.2 Criar Diretório e Baixar:**
```bash
# Criar diretório para o projeto
sudo mkdir -p /opt/phantom-identity
cd /opt/phantom-identity

# Baixar projeto do GitHub
sudo git clone https://github.com/jeanoliveirafs/servernovo.git .

# Verificar se baixou tudo
ls -la
```

### **2.3 Configurar Permissões:**
```bash
# Dar permissões corretas
sudo chown -R 1000:1000 /opt/phantom-identity
sudo chmod -R 755 /opt/phantom-identity

# Verificar estrutura
tree . -L 2
```

---

## 🔧 **ETAPA 3: PREPARAR CONFIGURAÇÕES**

### **3.1 Verificar Arquivos Essenciais:**
```bash
# Verificar se existem os arquivos principais
ls -la | grep -E "(orion-swarm-stack.yml|nginx|backend|frontend)"

# Ver conteúdo da stack
cat orion-swarm-stack.yml
```

### **3.2 Configurar Nginx:**
```bash
# Verificar configuração nginx
ls -la nginx/
cat nginx/nginx.conf

# Se necessário, copiar config do swarm
cp nginx/nginx-swarm.conf nginx/nginx.conf
```

### **3.3 Criar Variáveis de Ambiente:**
```bash
# Criar arquivo .env específico para VPS
sudo tee .env.production << EOF
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
CORS_ORIGIN=*
LOG_LEVEL=info
PHANTOM_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)
EOF

# Verificar arquivo criado
cat .env.production
```

---

## 🐳 **ETAPA 4: ACESSAR PORTAINER ORION DESIGN**

### **4.1 Abrir Portainer:**
- **URL:** `https://portainer.oriondesign.com.br` (ou IP do servidor)
- **Login:** Suas credenciais da Orion Design
- **Verificar:** Se está em modo **Swarm** (menu lateral deve mostrar "Swarm")

### **4.2 Verificar Ambiente:**
1. **Dashboard** → Verificar se mostra "Swarm Mode"
2. **Swarm** → **Nodes** → Ver quantos nós estão ativos
3. **Networks** → Verificar networks disponíveis

---

## 📦 **ETAPA 5: CRIAR STACK NO PORTAINER**

### **5.1 Navegar para Stacks:**
1. **Menu lateral** → **Stacks**
2. **Botão azul** → **"Add Stack"**

### **5.2 Configurar Stack:**
- **📝 Name:** `phantom-identity`
- **🔧 Build method:** Web editor
- **⚙️ Environment:** Certifique-se que está em **Swarm mode**

### **5.3 Colar Configuração:**
**No Web Editor, cole este YAML:**

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - phantom-net
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  app:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - app_code:/opt/phantom-identity
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REDIS_URL=redis://redis:6379
      - CORS_ORIGIN=*
      - LOG_LEVEL=info
    networks:
      - phantom-net
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == worker
        preferences:
          - spread: node.id
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 1G
          cpus: '0.8'
        reservations:
          memory: 512M
          cpus: '0.4'
      update_config:
        parallelism: 1
        delay: 30s
        failure_action: rollback
    command: >
      sh -c "
        cd /app &&
        npm install --production --silent &&
        npm start
      "
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 15s
      retries: 3
      start_period: 120s

  nginx:
    image: nginx:alpine
    ports:
      - target: 80
        published: 80
        protocol: tcp
        mode: ingress
      - target: 443
        published: 443
        protocol: tcp
        mode: ingress
    volumes:
      - nginx_config:/opt/phantom-identity/nginx
    networks:
      - phantom-net
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == worker
        preferences:
          - spread: node.id
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      resources:
        limits:
          memory: 256M
          cpus: '0.3'
        reservations:
          memory: 128M
          cpus: '0.1'
    depends_on:
      - app

  visualizer:
    image: dockersamples/visualizer:stable
    ports:
      - target: 8080
        published: 8080
        protocol: tcp
        mode: ingress
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - phantom-net
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure

volumes:
  redis_data:
    driver: local
  app_code:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/phantom-identity
  nginx_config:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/phantom-identity/nginx

networks:
  phantom-net:
    driver: overlay
    attachable: true
    driver_opts:
      encrypted: "true"
```

### **5.4 Configurar Environment Variables:**
**Na seção "Environment variables" adicione:**
```env
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
CORS_ORIGIN=*
LOG_LEVEL=info
```

---

## 🚀 **ETAPA 6: FAZER DEPLOY**

### **6.1 Deploy da Stack:**
1. **Revisar** toda configuração
2. **Clicar** em **"Deploy the stack"** (botão azul)
3. **Aguardar** download das imagens Docker

### **6.2 Acompanhar Deploy:**
- **Ver barra de progresso** do Portainer
- **Aguardar** aparecer "Stack deployed successfully"
- **Tempo estimado:** 2-5 minutos (dependendo da internet)

---

## ✅ **ETAPA 7: VERIFICAR SE ESTÁ FUNCIONANDO**

### **7.1 Verificar Services:**
1. **Swarm** → **Services**
2. **Verificar se estão rodando:**
   - ✅ `phantom_app` (2/2 replicas)
   - ✅ `phantom_nginx` (2/2 replicas) 
   - ✅ `phantom_redis` (1/1 replica)
   - ✅ `phantom_visualizer` (1/1 replica)

### **7.2 Verificar Logs:**
1. **Services** → **phantom_app**
2. **Aba "Logs"**
3. **Verificar** se não há erros críticos

### **7.3 Testar Aplicação:**
```bash
# No terminal da VPS, testar health check
curl http://localhost/health

# Ou
curl http://IP-DA-VPS/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "uptime": 123.45
}
```

---

## 🌐 **ETAPA 8: ACESSAR APLICAÇÃO**

### **8.1 Acessar Dashboard:**
- **URL:** `http://IP-DA-VPS` ou `http://seu-dominio.com`
- **Verificar:** Se carrega o dashboard do Phantom Identity

### **8.2 Testar PWA:**
1. **Abrir** no celular Chrome/Firefox
2. **Menu** → "Adicionar à tela inicial"
3. **Testar** funcionalidades offline

### **8.3 Verificar Visualizer:**
- **URL:** `http://IP-DA-VPS:8080`
- **Ver:** Distribuição dos containers no Swarm

---

## 🔧 **COMANDOS ÚTEIS VIA SSH**

### **Verificar Status Docker:**
```bash
# Ver serviços rodando
docker service ls

# Ver detalhes de um serviço
docker service ps phantom_app

# Ver logs específicos
docker service logs phantom_app -f

# Verificar networks
docker network ls
```

### **Scaling Manual:**
```bash
# Aumentar replicas da app
docker service scale phantom_app=4

# Reduzir para economizar recursos
docker service scale phantom_app=1
```

### **Troubleshooting:**
```bash
# Reiniciar stack completa
docker stack rm phantom
sleep 10
docker stack deploy -c orion-swarm-stack.yml phantom

# Ver uso de recursos
docker stats

# Limpar containers parados
docker system prune -f
```

---

## 🎯 **CHECKLIST FINAL**

### **📋 Pré-Deploy:**
- [ ] SSH conectado na VPS
- [ ] Projeto baixado do GitHub
- [ ] Permissões configuradas
- [ ] Portainer Orion acessível

### **🚀 Deploy:**
- [ ] Stack criada no Portainer
- [ ] YAML colado corretamente
- [ ] Environment variables configuradas
- [ ] Deploy executado com sucesso

### **✅ Verificação:**
- [ ] 4 services rodando (app, nginx, redis, visualizer)
- [ ] Health check respondendo
- [ ] Dashboard acessível via browser
- [ ] PWA instalável no mobile
- [ ] Visualizer mostrando containers

### **📊 Testes:**
- [ ] Criar link compartilhado
- [ ] Testar mascaramento de IP
- [ ] Verificar WebSocket funcionando
- [ ] Confirmar sincronização entre dispositivos

---

## 🎉 **PARABÉNS! DEPLOY CONCLUÍDO!**

**✅ Seu Phantom Identity está rodando em produção no Docker Swarm via Portainer Orion Design!**

### **📱 URLs de Acesso:**
- **Dashboard:** `http://IP-DA-VPS`
- **Visualizer:** `http://IP-DA-VPS:8080`
- **Health Check:** `http://IP-DA-VPS/health`
- **Métricas:** `http://IP-DA-VPS/api/metrics`

### **🌟 Funcionalidades Ativas:**
- ✅ **PWA** instalável
- ✅ **Links compartilhados** com IP masking
- ✅ **Alta disponibilidade** com múltiplas replicas
- ✅ **Load balancing** automático
- ✅ **Monitoramento** em tempo real

**🚀 SISTEMA ENTERPRISE PRONTO PARA USO!** 