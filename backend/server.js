const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const chalk = require('chalk');

const ProxyManager = require('./proxy-manager');
const FingerprintEngine = require('./fingerprint-engine');
const SharedLinksManager = require('./shared-links');
const { 
  httpMetricsMiddleware, 
  recordWebSocketConnection, 
  recordSyncAction,
  updateActiveClients,
  getMetrics 
} = require('./metrics');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(httpMetricsMiddleware);
app.use(express.static(path.join(__dirname, '../frontend')));

// Inicializar managers
const proxyManager = new ProxyManager();
const fingerprintEngine = new FingerprintEngine();
const sharedLinksManager = new SharedLinksManager();

// Armazenar clientes conectados
const connectedClients = new Map();
const phantomIdentities = new Map();

// Configuração padrão da identidade phantom
let defaultPhantomIdentity = {
  id: 'phantom-001',
  fingerprint: fingerprintEngine.generateFingerprint(),
  proxy: proxyManager.getRandomProxy(),
  behavior: {
    typingSpeed: { min: 120, max: 280 },
    mouseDelay: { min: 50, max: 200 },
    scrollSpeed: { min: 100, max: 300 }
  },
  createdAt: new Date(),
  lastUpdate: new Date()
};

console.log(chalk.blue('🚀 Iniciando Phantom Identity Server...'));

// WebSocket connections
io.on('connection', (socket) => {
  const clientId = uuidv4();
  console.log(chalk.green(`🔌 Cliente conectado: ${socket.id} (${clientId})`));
  
  connectedClients.set(socket.id, {
    id: clientId,
    connectedAt: new Date(),
    status: 'connected',
    lastActivity: new Date()
  });

  // Registrar métrica de conexão
  recordWebSocketConnection('phantom-client');
  updateActiveClients(connectedClients.size);

  // Enviar identidade phantom para o cliente
  socket.emit('phantom-identity', defaultPhantomIdentity);
  
  // Atualizar todos os clientes sobre nova conexão
  io.emit('clients-update', Array.from(connectedClients.values()));

  socket.on('request-identity', () => {
    socket.emit('phantom-identity', defaultPhantomIdentity);
    console.log(chalk.yellow(`📋 Identidade solicitada por: ${socket.id}`));
  });

  socket.on('sync-action', (data) => {
    // Retransmitir ação para todos os outros clientes
    socket.broadcast.emit('execute-action', data);
    console.log(chalk.cyan(`🔄 Ação sincronizada: ${data.type} por ${socket.id}`));
    
    // Registrar métrica de sincronização
    recordSyncAction(data.type);
    
    // Enviar log para o dashboard
    io.emit('new-log', {
      timestamp: new Date(),
      type: 'sync',
      message: `Ação ${data.type} sincronizada`,
      clientId: socket.id
    });
  });

  socket.on('client-status', (status) => {
    const client = connectedClients.get(socket.id);
    if (client) {
      client.status = status;
      client.lastActivity = new Date();
      io.emit('clients-update', Array.from(connectedClients.values()));
      console.log(chalk.blue(`📊 Status atualizado: ${socket.id} -> ${status}`));
    }
  });

  socket.on('fingerprint-test', (results) => {
    console.log(chalk.magenta(`🧪 Teste de fingerprint recebido de ${socket.id}:`, results));
    io.emit('test-results', { clientId: socket.id, results });
  });

  socket.on('disconnect', () => {
    console.log(chalk.red(`❌ Cliente desconectado: ${socket.id}`));
    connectedClients.delete(socket.id);
    updateActiveClients(connectedClients.size);
    io.emit('clients-update', Array.from(connectedClients.values()));
  });
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({
    status: 'active',
    clients: connectedClients.size,
    uptime: process.uptime(),
    phantomIdentity: defaultPhantomIdentity,
    proxies: proxyManager.getProxyCount(),
    fingerprints: fingerprintEngine.getStats()
  });
});

// Health check endpoint for Docker
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.post('/api/update-identity', (req, res) => {
  const { fingerprint, proxy, behavior } = req.body;
  
  if (fingerprint) Object.assign(defaultPhantomIdentity.fingerprint, fingerprint);
  if (proxy) Object.assign(defaultPhantomIdentity.proxy, proxy);
  if (behavior) Object.assign(defaultPhantomIdentity.behavior, behavior);
  
  defaultPhantomIdentity.lastUpdate = new Date();
  
  // Notificar todos os clientes sobre a atualização
  io.emit('identity-update', defaultPhantomIdentity);
  
  console.log(chalk.green('🔄 Identidade phantom atualizada'));
  res.json({ success: true, identity: defaultPhantomIdentity });
});

app.post('/api/generate-identity', (req, res) => {
  defaultPhantomIdentity = {
    id: `phantom-${Date.now()}`,
    fingerprint: fingerprintEngine.generateFingerprint(),
    proxy: proxyManager.getRandomProxy(),
    behavior: {
      typingSpeed: { min: 100 + Math.random() * 200, max: 200 + Math.random() * 200 },
      mouseDelay: { min: 30 + Math.random() * 100, max: 100 + Math.random() * 200 },
      scrollSpeed: { min: 80 + Math.random() * 150, max: 150 + Math.random() * 200 }
    },
    createdAt: new Date(),
    lastUpdate: new Date()
  };
  
  // Notificar todos os clientes sobre a nova identidade
  io.emit('identity-update', defaultPhantomIdentity);
  
  console.log(chalk.green('🎲 Nova identidade phantom gerada'));
  res.json({ success: true, identity: defaultPhantomIdentity });
});

app.get('/api/metrics', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    res.end(await getMetrics());
  } catch (error) {
    res.status(500).json({ error: 'Failed to get metrics' });
  }
});

app.get('/api/test-sites', (req, res) => {
  res.json([
    { name: 'FingerprintJS', url: 'https://fingerprint.com/demo', category: 'fingerprint', description: 'Teste de detecção de fingerprint' },
    { name: 'Whoer', url: 'https://whoer.net', category: 'ip-detection', description: 'Verificação de IP e DNS' },
    { name: 'IPLeak', url: 'https://ipleak.net', category: 'ip-leak', description: 'Teste de vazamentos de IP' },
    { name: 'AmIUnique', url: 'https://amiunique.org', category: 'uniqueness', description: 'Análise de unicidade do browser' },
    { name: 'Cover Your Tracks', url: 'https://coveryourtracks.eff.org', category: 'tracking', description: 'Proteção contra tracking' },
    { name: 'BrowserLeaks', url: 'https://browserleaks.com', category: 'comprehensive', description: 'Testes abrangentes de privacidade' }
  ]);
});

app.get('/api/proxies', (req, res) => {
  res.json({
    proxies: proxyManager.getAllProxies(),
    active: proxyManager.getActiveProxy(),
    stats: proxyManager.getStats()
  });
});

app.post('/api/proxy/test', async (req, res) => {
  const { proxy } = req.body;
  try {
    const result = await proxyManager.testProxy(proxy);
    res.json({ success: true, result });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// Routes para Links Compartilhados
app.post('/api/shared-links/generate', (req, res) => {
  const { targetUrl, expiresIn, allowMobile, description } = req.body;
  
  if (!targetUrl) {
    return res.status(400).json({ error: 'URL de destino é obrigatória' });
  }

  try {
    const linkData = sharedLinksManager.generateSharedLink(targetUrl, {
      expiresIn: expiresIn || '24h',
      allowMobile: allowMobile !== false,
      description: description || ''
    });

    res.json({ success: true, ...linkData });
    
    console.log(chalk.green(`🔗 Link compartilhado criado por ${req.ip}`));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shared-links/active', (req, res) => {
  try {
    const activeLinks = sharedLinksManager.getActiveLinks();
    res.json({ success: true, links: activeLinks });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/shared-links/:linkId/stats', (req, res) => {
  const { linkId } = req.params;
  
  try {
    const stats = sharedLinksManager.getLinkStats(linkId);
    if (!stats) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/shared-links/:linkId', (req, res) => {
  const { linkId } = req.params;
  
  try {
    const success = sharedLinksManager.deactivateLink(linkId);
    if (!success) {
      return res.status(404).json({ error: 'Link não encontrado' });
    }
    res.json({ success: true, message: 'Link desativado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rota para acessar link compartilhado
app.get('/shared/:shortId', (req, res) => {
  const { shortId } = req.params;
  
  try {
    const linkData = sharedLinksManager.getLinkByShortId(shortId);
    
    if (!linkData) {
      return res.status(404).send(`
        <html>
          <head>
            <title>Link não encontrado</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>🔗 Link não encontrado</h1>
            <p>Este link pode ter expirado ou não existe.</p>
          </body>
        </html>
      `);
    }

    const validation = sharedLinksManager.validateLink(linkData.linkId);
    
    if (!validation.valid) {
      return res.status(410).send(`
        <html>
          <head>
            <title>Link expirado</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1>⏰ Link expirado</h1>
            <p>${validation.error}</p>
          </body>
        </html>
      `);
    }

    // Registrar acesso
    const accessData = {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      referrer: req.headers['referer']
    };

    sharedLinksManager.recordAccess(linkData.linkId, accessData);

    // Página intermediária com identidade mascarada
    res.send(`
      <html>
        <head>
          <title>🎭 Phantom Identity - Redirecionando...</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta name="theme-color" content="#16213e">
          <style>
            body {
              font-family: Arial, sans-serif;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: white;
              text-align: center;
              padding: 50px 20px;
              margin: 0;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
            }
            .logo {
              font-size: 4em;
              margin-bottom: 20px;
            }
            .title {
              font-size: 2em;
              margin-bottom: 10px;
              color: #64b5f6;
            }
            .subtitle {
              color: #aaa;
              margin-bottom: 30px;
            }
            .identity-info {
              background: rgba(255,255,255,0.1);
              border-radius: 10px;
              padding: 20px;
              margin: 20px 0;
              text-align: left;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              font-size: 0.9em;
            }
            .loader {
              border: 3px solid rgba(255,255,255,0.3);
              border-top: 3px solid #64b5f6;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .redirect-btn {
              background: #64b5f6;
              color: white;
              border: none;
              padding: 15px 30px;
              border-radius: 25px;
              font-size: 1.1em;
              cursor: pointer;
              margin-top: 20px;
              transition: background 0.3s;
            }
            .redirect-btn:hover {
              background: #42a5f5;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo">👻</div>
            <h1 class="title">Phantom Identity</h1>
            <p class="subtitle">Identidade mascarada aplicada com sucesso</p>
            
            <div class="identity-info">
              <h3>🎭 Sua Nova Identidade:</h3>
              <div class="info-row">
                <span>IP Compartilhado:</span>
                <span>${linkData.sharedIdentity.proxy.ip}</span>
              </div>
              <div class="info-row">
                <span>Localização:</span>
                <span>${linkData.sharedIdentity.proxy.location}</span>
              </div>
              <div class="info-row">
                <span>ISP:</span>
                <span>${linkData.sharedIdentity.proxy.isp}</span>
              </div>
              <div class="info-row">
                <span>Navegador:</span>
                <span>Chrome 120.0.0.0</span>
              </div>
            </div>

            <div class="loader"></div>
            <p>Aplicando fingerprint e redirecionando...</p>
            
            <button class="redirect-btn" onclick="redirectNow()">
              🚀 Ir para ${new URL(linkData.targetUrl).hostname}
            </button>
          </div>

          <script>
            // Aplicar fingerprint mascarado
            const identity = ${JSON.stringify(linkData.sharedIdentity)};
            
            // Substituir propriedades do navegador
            Object.defineProperty(navigator, 'userAgent', {
              get: () => identity.fingerprint.userAgent
            });
            
            Object.defineProperty(navigator, 'platform', {
              get: () => identity.fingerprint.platform
            });
            
            Object.defineProperty(navigator, 'language', {
              get: () => identity.fingerprint.language
            });

            // Função de redirecionamento
            function redirectNow() {
              window.location.href = '${linkData.targetUrl}';
            }

            // Auto-redirect após 3 segundos
            setTimeout(() => {
              redirectNow();
            }, 3000);
          </script>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Erro ao processar link compartilhado:', error);
    res.status(500).send('Erro interno do servidor');
  }
});

// Servir frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(chalk.green(`🚀 Phantom Identity Server rodando na porta ${PORT}`));
  console.log(chalk.blue(`📊 Dashboard: http://localhost:${PORT}`));
  console.log(chalk.cyan(`🔌 WebSocket: ws://localhost:${PORT}`));
  console.log(chalk.yellow(`👻 Identidade Phantom ativa: ${defaultPhantomIdentity.id}`));
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(chalk.red('🛑 Encerrando servidor...'));
  server.close(() => {
    console.log(chalk.red('✅ Servidor encerrado graciosamente'));
    process.exit(0);
  });
});