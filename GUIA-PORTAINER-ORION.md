# 🚀 Guia Completo - Deploy Phantom Identity no Portainer (Orion Design)

## 📋 Pré-requisitos
- Acesso ao Portainer da Orion Design
- VPS configurada com Docker
- Arquivos do projeto preparados

## 🔧 Passo 1: Preparar Arquivos no VPS

### 1.1 Conectar na VPS
```bash
ssh usuario@seu-servidor-vps
```

### 1.2 Criar diretório do projeto
```bash
mkdir -p /var/www/phantom-identity
cd /var/www/phantom-identity
```

### 1.3 Fazer upload dos arquivos
Você pode usar SCP, SFTP ou Git:

**Opção A - Via Git (Recomendado):**
```bash
git clone [seu-repositorio] .
```

**Opção B - Via SCP (do seu PC):**
```bash
scp -r C:\saas\sistema-bull/* usuario@vps:/var/www/phantom-identity/
```

## 🐳 Passo 2: Configurar no Portainer

### 2.1 Acessar Portainer
1. Abra o Portainer da Orion Design
2. Faça login com suas credenciais
3. Selecione o ambiente Docker (local ou remoto)

### 2.2 Criar Stack
1. **Vá em "Stacks"** no menu lateral
2. **Clique em "Add Stack"**
3. **Nome da Stack:** `phantom-identity`
4. **Web editor:** Cole o conteúdo do arquivo `portainer-stack.yml`

### 2.3 Configurar Variáveis de Ambiente
Na seção **"Environment variables"**:

```env
NODE_ENV=production
PORT=3000
REDIS_URL=redis://redis:6379
CORS_ORIGIN=*
LOG_LEVEL=info
PHANTOM_IDENTITY_SECRET=SUA_CHAVE_SECRETA_FORTE
SESSION_SECRET=SUA_SESSION_SECRET_FORTE
```

**⚠️ IMPORTANTE:** Gere chaves seguras:
- Use geradores online ou comando: `openssl rand -hex 32`

### 2.4 Configurar Volumes
Na seção **"Advanced configuration"**:

1. **Volume para arquivos:**
   - **Container path:** `/app`
   - **Host path:** `/var/www/phantom-identity`

2. **Volume para dados Redis:**
   - **Container path:** `/data`
   - **Host path:** `/var/lib/redis`

## 🌐 Passo 3: Configurar Nginx (Proxy Reverso)

### 3.1 Verificar arquivo nginx.conf
Certifique-se que o arquivo `nginx/nginx.conf` existe com:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;
    
    location / {
        proxy_pass http://app:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 3.2 Atualizar domínio
Substitua `seu-dominio.com` pelo seu domínio real.

## 🚀 Passo 4: Deploy da Stack

### 4.1 Executar Deploy
1. **Clique em "Deploy the stack"**
2. **Aguarde** o download das imagens
3. **Verifique logs** se houver erros

### 4.2 Verificar Status
1. Vá em **"Containers"**
2. Verifique se todos estão **"Running"**:
   - `phantom-app`
   - `phantom-redis` 
   - `phantom-nginx`

## 🔍 Passo 5: Testar Aplicação

### 5.1 Verificar Health Check
```bash
curl http://seu-dominio.com/health
```

### 5.2 Acessar Dashboard
1. Abra: `http://seu-dominio.com`
2. Teste todas as funcionalidades
3. Verifique PWA no mobile

### 5.3 Testar Links Compartilhados
1. Crie um link no dashboard
2. Teste acesso em diferentes dispositivos
3. Verifique mascaramento de IP

## 📊 Passo 6: Monitoramento

### 6.1 Logs do Container
No Portainer:
1. **Containers** → **phantom-app**
2. **Logs** → Verificar erros
3. **Stats** → Monitor recursos

### 6.2 Métricas da Aplicação
- Acesse: `http://seu-dominio.com/api/metrics`
- Monitor clientes conectados
- Verificar performance

## 🔒 Passo 7: Configurações de Segurança

### 7.1 SSL/HTTPS (Recomendado)
Adicione certificado SSL:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    # ... resto da config
}
```

### 7.2 Firewall
Configure firewall para permitir apenas:
- Porta 80 (HTTP)
- Porta 443 (HTTPS)
- Porta 22 (SSH)

## 🛠️ Comandos Úteis de Troubleshooting

### Reiniciar Stack
```bash
docker-compose -f portainer-stack.yml restart
```

### Ver logs específicos
```bash
docker logs phantom-app
docker logs phantom-redis
docker logs phantom-nginx
```

### Limpar volumes (CUIDADO!)
```bash
docker volume prune
```

## 📱 Configurações PWA

### 8.1 Testar PWA
1. Acesse no mobile Chrome/Firefox
2. "Adicionar à tela inicial"
3. Teste funcionalidades offline

### 8.2 Push Notifications
Configure service worker se necessário.

## 🌟 Configurações Específicas da Orion Design

### 9.1 Network Settings
- Use bridge network padrão
- Configure port mapping adequadamente

### 9.2 Volume Permissions
```bash
chown -R 1000:1000 /var/www/phantom-identity
chmod -R 755 /var/www/phantom-identity
```

### 9.3 Environment Variables no Portainer
- Use seção "Environment variables" 
- Não hardcode secrets no YAML

## 🚨 Troubleshooting Comum

### Problema: Container não inicia
**Solução:**
1. Verificar logs: `docker logs phantom-app`
2. Verificar permissões de arquivo
3. Testar build local

### Problema: Redis connection failed
**Solução:**
1. Verificar se Redis está rodando
2. Checar network connectivity
3. Validar REDIS_URL

### Problema: Nginx 502 Bad Gateway
**Solução:**
1. Verificar se app está na porta 3000
2. Checar configuração nginx.conf
3. Restart containers

## ✅ Checklist Final

- [ ] Stack rodando sem erros
- [ ] Health check respondendo
- [ ] Dashboard acessível
- [ ] WebSocket funcionando
- [ ] Links compartilhados criando
- [ ] PWA instalável
- [ ] Logs sem erros críticos
- [ ] Performance adequada

## 📞 Suporte

Se encontrar problemas:
1. Verifique logs detalhados
2. Teste connectivity entre containers
3. Valide configurações de environment

---

**🎉 Parabéns! Seu Phantom Identity está rodando no Portainer da Orion Design!** 