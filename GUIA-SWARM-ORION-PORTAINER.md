# 🚀 Docker Swarm no Portainer Orion Design - Guia Específico

## ⚡ **CONFIGURAÇÃO ESPECÍFICA PARA ORION DESIGN**

### 🎯 **Diferenças no Portainer da Orion Design:**
- Interface customizada da Orion
- Docker Swarm já configurado
- Templates pré-configurados
- Networking específico
- Volumes gerenciados

---

## 🔧 **PASSO A PASSO NO PORTAINER ORION DESIGN**

### **1. Acesso ao Portainer**
1. **Login** no Portainer da Orion Design
2. **Selecionar ambiente** Docker Swarm (não local)
3. **Verificar** se está em modo Swarm: 
   - Menu lateral → **Swarm** deve estar visível

### **2. Criar Stack no Swarm**
1. **Menu lateral** → **Stacks**
2. **Botão** "Add Stack"
3. **Configurações importantes:**
   - ✅ **Name:** `phantom-identity`
   - ✅ **Build method:** Web editor
   - ✅ **Environment:** Swarm (não Standalone)

### **3. Configuração da Stack**

#### **📝 Web Editor:**
Cole o conteúdo do arquivo `docker-swarm-stack.yml`

#### **🔧 Environment Variables (seção específica da Orion):**
```env
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
CORS_ORIGIN=*
LOG_LEVEL=info
PHANTOM_SECRET=gerar-chave-segura-32-chars
SESSION_SECRET=gerar-outra-chave-segura-32
```

#### **📁 Advanced Configuration:**
- **Enable access control:** ❌ (desligado)
- **Network:** Usar a network padrão do Swarm
- **Restart policy:** Unless stopped

### **4. Deploy Específico da Orion**
1. **Deploy stack** (botão azul)
2. **Aguardar** pull das imagens
3. **Verificar logs** se houver erro
4. **Status** deve aparecer "Running"

---

## 🌐 **CONFIGURAÇÕES DE NETWORK ORION DESIGN**

### **Network Overlay Personalizada:**
O Portainer da Orion pode ter networks específicas:

```yaml
networks:
  phantom-overlay:
    driver: overlay
    external: false
    attachable: true
    # Configurações específicas da Orion
    driver_opts:
      encrypted: "true"
    ipam:
      driver: default
      config:
        - subnet: 10.10.0.0/24
```

### **Portas Expostas:**
- **80** → HTTP (Nginx)
- **443** → HTTPS (Nginx) 
- **3000** → App (interno)
- **8080** → Visualizer
- **6379** → Redis (interno)

---

## 📊 **MONITORAMENTO NO PORTAINER ORION**

### **1. Dashboard Swarm:**
- **Menu:** Swarm → Overview
- **Visualizar:** Distribuição de serviços
- **Nodes:** Status dos nós do cluster

### **2. Services:**
- **Menu:** Swarm → Services
- **Verificar:**
  - `phantom_app` (2/2 replicas)
  - `phantom_nginx` (2/2 replicas)
  - `phantom_redis` (1/1 replica)
  - `phantom_visualizer` (1/1 replica)

### **3. Logs em Tempo Real:**
1. **Services** → **phantom_app**
2. **Logs tab**
3. **Enable auto-refresh**

### **4. Métricas Específicas:**
- **CPU/Memory:** Dashboard do Portainer
- **Custom metrics:** `http://seu-dominio/api/metrics`
- **Visualizer:** `http://seu-dominio:8080`

---

## 🔧 **SCALING NO PORTAINER ORION**

### **Interface Gráfica:**
1. **Swarm** → **Services**
2. **Selecionar serviço** (ex: phantom_app)
3. **Scale** → **Adjust replicas**
4. **Update** → Aplicar

### **Scaling Recomendado:**
```yaml
# Baixo tráfego
phantom_app: 1 replica
phantom_nginx: 1 replica

# Médio tráfego  
phantom_app: 2 replicas
phantom_nginx: 2 replicas

# Alto tráfego
phantom_app: 4 replicas
phantom_nginx: 3 replicas
```

---

## 🛠️ **TROUBLESHOOTING ORION PORTAINER**

### **Problema: Stack não deploya**
**Soluções:**
1. **Verificar YAML:** Syntax válida
2. **Environment vars:** Todas preenchidas
3. **Network:** Usar overlay network
4. **Placement:** Verificar constraints

### **Problema: Serviço não inicia**
**No Portainer:**
1. **Services** → **phantom_app**
2. **Tasks tab** → Ver erros
3. **Logs** → Debug específico
4. **Inspect** → Verificar configuração

### **Problema: Network não conecta**
**Verificar:**
1. **Networks** → **phantom-overlay**
2. **Containers** → Network assignments
3. **Firewall** → Portas liberadas
4. **DNS** → Service discovery

---

## ⚙️ **CONFIGURAÇÕES ESPECÍFICAS ORION**

### **1. Volumes Persistentes:**
```yaml
volumes:
  redis_data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/phantom/redis
  
  app_data:
    driver: local  
    driver_opts:
      type: none
      o: bind
      device: /opt/phantom/app
```

### **2. Secrets Management:**
**No Portainer:**
1. **Swarm** → **Secrets**
2. **Add secret**
3. **Reference na stack:**

```yaml
secrets:
  phantom_secret:
    external: true
services:
  app:
    secrets:
      - phantom_secret
```

### **3. Configs para Nginx:**
**Criar config no Portainer:**
1. **Swarm** → **Configs**
2. **Add config** → `nginx_config`
3. **Reference na stack:**

```yaml
configs:
  nginx_config:
    external: true
services:
  nginx:
    configs:
      - source: nginx_config
        target: /etc/nginx/conf.d/default.conf
```

---

## 🚀 **DEPLOY OTIMIZADO ORION DESIGN**

### **Stack YAML Final para Orion:**
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
        constraints: [node.role == manager]
      resources:
        limits: {memory: 512M}
        reservations: {memory: 256M}

  app:
    image: node:18-alpine
    working_dir: /app
    volumes:
      - app_data:/app
    environment:
      - NODE_ENV=production
      - PORT=3000
      - REDIS_URL=redis://redis:6379
    networks:
      - phantom-net
    deploy:
      replicas: 2
      placement:
        constraints: [node.role == worker]
      resources:
        limits: {memory: 1G, cpus: '0.5'}
        reservations: {memory: 512M, cpus: '0.25'}
    command: sh -c "npm install --production && npm start"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    configs:
      - source: nginx_config
        target: /etc/nginx/conf.d/default.conf
    networks:
      - phantom-net
    deploy:
      replicas: 2
      placement:
        constraints: [node.role == worker]

volumes:
  redis_data:
  app_data:

networks:
  phantom-net:
    driver: overlay
    attachable: true

configs:
  nginx_config:
    file: ./nginx/nginx-swarm.conf
```

---

## ✅ **CHECKLIST ORION PORTAINER**

### **📋 Pré-Deploy:**
- [ ] Login no Portainer Orion Design
- [ ] Swarm mode ativo
- [ ] Arquivos nginx configurados
- [ ] Environment variables definidas

### **🚀 Deploy:**
- [ ] Stack criada com sucesso
- [ ] Todos os services running
- [ ] Networks funcionando
- [ ] Volumes montados

### **📊 Pós-Deploy:**
- [ ] Dashboard acessível
- [ ] Visualizer funcionando (porta 8080)
- [ ] Scaling testado
- [ ] Logs sem erros

### **🔧 Testes:**
- [ ] Health checks passando
- [ ] PWA instalável
- [ ] Links compartilhados funcionando
- [ ] WebSocket sync ativo

---

## 🎯 **COMANDOS ESPECÍFICOS ORION**

### **Via Portainer Interface:**
- **Deploy:** Interface gráfica
- **Scale:** Slider ou input numérico
- **Logs:** Real-time viewer
- **Update:** Rolling update automático

### **Via CLI (se necessário):**
```bash
# Conectar no servidor da Orion
ssh user@orion-server

# Deploy
docker stack deploy -c docker-swarm-stack.yml phantom

# Verificar
docker service ls
docker stack services phantom
```

---

## 🎉 **RESULTADO FINAL ORION DESIGN**

**✅ PHANTOM IDENTITY 100% COMPATÍVEL COM PORTAINER ORION!**

### **🌟 Benefícios Obtidos:**
- **Interface amigável** do Portainer customizado
- **Swarm gerenciado** pela Orion Design
- **Scaling visual** via dashboard
- **Monitoramento integrado**
- **Deploy simplificado**

### **📱 Funcionalidades Mantidas:**
- **PWA completo** em cluster
- **Links compartilhados** distribuídos
- **Alta disponibilidade** automática
- **Load balancing** transparente

**🚀 PRONTO PARA DEPLOY NO PORTAINER DA ORION DESIGN!** 