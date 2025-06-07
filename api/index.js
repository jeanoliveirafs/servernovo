const { v4: uuidv4 } = require('uuid');

// Simulação de banco em memória para desenvolvimento
// Em produção, usar Vercel KV ou Upstash Redis
let phantomIdentities = new Map();
let sharedLinks = new Map();
let connectedClients = new Map();

// Configuração padrão da identidade phantom
let defaultPhantomIdentity = {
  id: 'phantom-001',
  fingerprint: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    language: 'pt-BR,pt;q=0.9,en;q=0.8',
    timezone: 'America/Sao_Paulo',
    platform: 'Win32',
    screen: { width: 1920, height: 1080 }
  },
  proxy: {
    ip: '192.168.1.100',
    location: 'São Paulo',
    provider: 'AWS'
  },
  createdAt: new Date()
};

// Funções auxiliares
function generateFingerprint() {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  const languages = ['en-US,en;q=0.9', 'pt-BR,pt;q=0.9,en;q=0.8', 'es-ES,es;q=0.9,en;q=0.8'];
  const timezones = ['America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Asia/Tokyo'];
  const platforms = ['Win32', 'MacIntel', 'Linux x86_64'];

  return {
    userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
    language: languages[Math.floor(Math.random() * languages.length)],
    timezone: timezones[Math.floor(Math.random() * timezones.length)],
    platform: platforms[Math.floor(Math.random() * platforms.length)],
    screen: {
      width: 1920 + Math.floor(Math.random() * 400),
      height: 1080 + Math.floor(Math.random() * 200),
      colorDepth: 24,
      pixelDepth: 24
    },
    canvas: generateCanvasFingerprint(),
    webgl: generateWebGLFingerprint(),
    fonts: generateFontList()
  };
}

function generateCanvasFingerprint() {
  return Math.random().toString(36).substring(2, 15);
}

function generateWebGLFingerprint() {
  const vendors = ['Intel Inc.', 'NVIDIA Corporation', 'AMD', 'Apple'];
  const renderers = ['Intel HD Graphics', 'NVIDIA GeForce', 'AMD Radeon', 'Apple GPU'];
  
  return {
    vendor: vendors[Math.floor(Math.random() * vendors.length)],
    renderer: renderers[Math.floor(Math.random() * renderers.length)]
  };
}

function generateFontList() {
  const fonts = ['Arial', 'Times New Roman', 'Helvetica', 'Georgia', 'Verdana', 'Calibri'];
  return fonts.slice(0, Math.floor(Math.random() * 3) + 3);
}

function getRandomProxy() {
  const locations = ['New York', 'London', 'Tokyo', 'São Paulo', 'Sydney'];
  const providers = ['AWS', 'DigitalOcean', 'Google Cloud', 'Azure'];
  
  return {
    ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
    location: locations[Math.floor(Math.random() * locations.length)],
    provider: providers[Math.floor(Math.random() * providers.length)],
    port: Math.floor(Math.random() * 10000) + 3000
  };
}

// Função principal do Vercel
module.exports = async (req, res) => {
  const { method, url } = req;
  const pathname = new URL(url, `http://${req.headers.host}`).pathname;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Health check
    if (pathname === '/health') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        platform: 'vercel'
      });
      return;
    }

    // API Status
    if (pathname === '/api/status') {
      res.status(200).json({
        status: 'active',
        clients: connectedClients.size,
        uptime: process.uptime(),
        phantomIdentity: defaultPhantomIdentity,
        sharedLinks: sharedLinks.size,
        platform: 'vercel-serverless'
      });
      return;
    }

    // Generate new identity
    if (pathname === '/api/generate-identity' && method === 'POST') {
      defaultPhantomIdentity = {
        id: `phantom-${Date.now()}`,
        fingerprint: generateFingerprint(),
        proxy: getRandomProxy(),
        behavior: {
          typingSpeed: { min: 100 + Math.random() * 200, max: 200 + Math.random() * 200 },
          mouseDelay: { min: 30 + Math.random() * 100, max: 100 + Math.random() * 200 },
          scrollSpeed: { min: 80 + Math.random() * 150, max: 150 + Math.random() * 200 }
        },
        createdAt: new Date(),
        lastUpdate: new Date()
      };

      res.status(200).json({ 
        success: true, 
        identity: defaultPhantomIdentity 
      });
      return;
    }

    // Update identity
    if (pathname === '/api/update-identity' && method === 'POST') {
      const { fingerprint, proxy, behavior } = req.body;
      
      if (fingerprint) Object.assign(defaultPhantomIdentity.fingerprint, fingerprint);
      if (proxy) Object.assign(defaultPhantomIdentity.proxy, proxy);
      if (behavior) Object.assign(defaultPhantomIdentity.behavior, behavior);
      
      defaultPhantomIdentity.lastUpdate = new Date();
      
      res.status(200).json({ 
        success: true, 
        identity: defaultPhantomIdentity 
      });
      return;
    }

    // Shared Links - Create
    if (pathname === '/api/shared-links' && method === 'POST') {
      const { name, expiresIn } = req.body || {};
      const linkId = uuidv4();
      
      const sharedLink = {
        id: linkId,
        name: name || 'Link Compartilhado',
        url: `https://${req.headers.host}/shared/${linkId}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + (expiresIn || 3600) * 1000),
        phantomIdentity: defaultPhantomIdentity
      };
      
      sharedLinks.set(linkId, sharedLink);
      
      res.status(200).json({
        success: true,
        link: sharedLink
      });
      return;
    }

    // Shared Links - List
    if (pathname === '/api/shared-links' && method === 'GET') {
      const activeLinks = Array.from(sharedLinks.values())
        .filter(link => link.active && new Date() < link.expiresAt)
        .map(link => ({
          ...link,
          phantomIdentity: undefined // Remove dados sensíveis
        }));

      res.status(200).json({
        success: true,
        links: activeLinks,
        total: activeLinks.length
      });
      return;
    }

    // Access shared link
    if (pathname.startsWith('/api/shared-links/') && method === 'GET') {
      const linkId = pathname.split('/').pop();
      const link = sharedLinks.get(linkId);
      
      if (!link || !link.active) {
        res.status(404).json({ error: 'Link não encontrado' });
        return;
      }
      
      if (new Date() > link.expiresAt) {
        res.status(410).json({ error: 'Link expirado' });
        return;
      }
      
      if (link.maxUses && link.currentUses >= link.maxUses) {
        res.status(429).json({ error: 'Limite de usos atingido' });
        return;
      }
      
      // Incrementar uso
      link.currentUses++;
      sharedLinks.set(linkId, link);
      
      res.status(200).json({
        success: true,
        identity: link.phantomIdentity,
        linkInfo: {
          name: link.name,
          description: link.description,
          usesRemaining: link.maxUses ? link.maxUses - link.currentUses : null
        }
      });
      return;
    }

    // Test sites
    if (pathname === '/api/test-sites') {
      res.status(200).json([
        { name: 'FingerprintJS', url: 'https://fingerprint.com/demo', category: 'fingerprint', description: 'Teste de detecção de fingerprint' },
        { name: 'Whoer', url: 'https://whoer.net', category: 'ip-detection', description: 'Verificação de IP e DNS' },
        { name: 'IPLeak', url: 'https://ipleak.net', category: 'ip-leak', description: 'Teste de vazamentos de IP' },
        { name: 'AmIUnique', url: 'https://amiunique.org', category: 'uniqueness', description: 'Análise de unicidade do browser' },
        { name: 'Cover Your Tracks', url: 'https://coveryourtracks.eff.org', category: 'tracking', description: 'Proteção contra tracking' },
        { name: 'BrowserLeaks', url: 'https://browserleaks.com', category: 'comprehensive', description: 'Testes abrangentes de privacidade' }
      ]);
      return;
    }

    // Metrics endpoint
    if (pathname === '/api/metrics') {
      const metrics = `
# HELP phantom_clients_total Total connected clients
# TYPE phantom_clients_total gauge
phantom_clients_total ${connectedClients.size}

# HELP phantom_shared_links_total Total shared links
# TYPE phantom_shared_links_total gauge  
phantom_shared_links_total ${sharedLinks.size}

# HELP phantom_uptime_seconds Uptime in seconds
# TYPE phantom_uptime_seconds gauge
phantom_uptime_seconds ${process.uptime()}
      `;
      
      res.setHeader('Content-Type', 'text/plain');
      res.status(200).send(metrics);
      return;
    }

    // 404 para outras rotas
    res.status(404).json({ error: 'Endpoint não encontrado' });
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message 
    });
  }
}; 