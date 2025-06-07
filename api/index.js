const { v4: uuidv4 } = require('uuid');

// Simulação de banco em memória para desenvolvimento
// Em produção, usar Vercel KV ou Upstash Redis
let phantomIdentities = new Map();
let sharedLinks = new Map();
let connectedClients = new Map();

// Configuração padrão da identidade phantom
// Inicializar com identidade brasileira
let defaultPhantomIdentity = null;

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

// Função para gerar identidades brasileiras
function generateBrazilianIdentity() {
  const brazilianUserAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];

  const brazilianTimezones = ['America/Sao_Paulo', 'America/Fortaleza', 'America/Manaus', 'America/Campo_Grande'];
  const brazilianCities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Brasília', 'Salvador', 'Fortaleza'];
  const brazilianIPs = [
    '187.8.42.155', '200.150.68.23', '177.69.143.89', '191.36.9.174', 
    '201.23.45.67', '179.108.75.234', '186.250.162.45'
  ];

  return {
    id: `phantom-${Date.now()}`,
    fingerprint: {
      userAgent: brazilianUserAgents[Math.floor(Math.random() * brazilianUserAgents.length)],
      language: 'pt-BR,pt;q=0.9,en;q=0.8',
      timezone: brazilianTimezones[Math.floor(Math.random() * brazilianTimezones.length)],
      platform: 'Win32',
      screen: {
        width: 1920 + Math.floor(Math.random() * 400),
        height: 1080 + Math.floor(Math.random() * 200)
      }
    },
    proxy: {
      ip: brazilianIPs[Math.floor(Math.random() * brazilianIPs.length)],
      location: `${brazilianCities[Math.floor(Math.random() * brazilianCities.length)]}, Brasil`,
      provider: 'Vercel Brazil',
      port: Math.floor(Math.random() * 10000) + 3000
    },
    createdAt: new Date(),
    lastUpdate: new Date()
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

  // Debug log
  console.log(`📡 ${method} ${pathname}`);

  try {
    // Health check
    if (pathname === '/health') {
      res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        platform: 'vercel',
        location: 'Brazil'
      });
      return;
    }

    // API Status
    if (pathname === '/api/status') {
      // Inicializar identidade brasileira se não existe
      if (!defaultPhantomIdentity) {
        defaultPhantomIdentity = generateBrazilianIdentity();
      }
      
      res.status(200).json({
        status: 'active',
        uptime: process.uptime(),
        phantomIdentity: defaultPhantomIdentity,
        sharedLinks: sharedLinks.size,
        platform: 'vercel-serverless',
        location: 'São Paulo, Brasil'
      });
      return;
    }

    // Generate new identity
    if (pathname === '/api/generate-identity' && method === 'POST') {
      defaultPhantomIdentity = generateBrazilianIdentity();
      
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

    // Create shared link
    if (pathname === '/api/shared-links' && method === 'POST') {
      console.log('🔗 Creating shared link...');
      
      // Garantir que temos identidade brasileira
      if (!defaultPhantomIdentity) {
        defaultPhantomIdentity = generateBrazilianIdentity();
        console.log('🇧🇷 Generated Brazilian identity');
      }
      
      try {
        const body = await getRequestBody(req);
        console.log('📦 Request body:', body);
        
        const { name, expiresIn, targetUrl, allowMobile } = body;
        
        if (!targetUrl) {
          res.status(400).json({
            success: false,
            error: 'URL de destino é obrigatória'
          });
          return;
        }
        
        const linkId = uuidv4().substring(0, 8); // ID mais curto
        const expirationTime = Date.now() + (parseInt(expiresIn) || 3600) * 1000;
        
        const sharedLink = {
          id: linkId,
          name: name || 'Link Compartilhado',
          targetUrl: targetUrl,
          url: `https://${req.headers.host}/shared/${linkId}`,
          createdAt: new Date(),
          expiresAt: new Date(expirationTime),
          allowMobile: allowMobile || false,
          phantomIdentity: { ...defaultPhantomIdentity },
          active: true,
          uses: 0
        };
        
        sharedLinks.set(linkId, sharedLink);
        console.log('✅ Link created:', linkId);
        
        res.status(200).json({
          success: true,
          link: sharedLink,
          shortId: linkId,
          fullUrl: `/shared/${linkId}`,
          sharedIP: defaultPhantomIdentity.proxy.ip,
          expiresAt: sharedLink.expiresAt
        });
        return;
        
      } catch (error) {
        console.error('❌ Error creating link:', error);
        res.status(500).json({
          success: false,
          error: 'Erro ao processar requisição: ' + error.message
        });
        return;
      }
    }

    // List shared links
    if (pathname === '/api/shared-links' && method === 'GET') {
      const activeLinks = Array.from(sharedLinks.values())
        .filter(link => link.active && new Date() < link.expiresAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      res.status(200).json({
        success: true,
        links: activeLinks,
        total: activeLinks.length
      });
      return;
    }

    // Access shared link
    if (pathname.startsWith('/shared/')) {
      const linkId = pathname.split('/')[2];
      const link = sharedLinks.get(linkId);
      
      if (!link || !link.active) {
        res.status(404).json({ error: 'Link não encontrado' });
        return;
      }
      
      if (new Date() > link.expiresAt) {
        res.status(410).json({ error: 'Link expirado' });
        return;
      }
      
      // Incrementar uso
      link.uses++;
      sharedLinks.set(linkId, link);
      
      // Redirecionar para URL de destino com identidade phantom
      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Phantom Identity - Redirecionamento Seguro</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>🎭 Redirecionamento Phantom</h1>
          <p>Aplicando identidade mascarada...</p>
          <script>
            // Aplicar configurações phantom
            Object.defineProperty(navigator, 'userAgent', {
              get: () => '${link.phantomIdentity.fingerprint.userAgent}'
            });
            
            setTimeout(() => {
              window.location.href = '${link.targetUrl}';
            }, 2000);
          </script>
        </body>
        </html>
      `);
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
    // Debug - listar todos os endpoints disponíveis
    if (pathname === '/api/debug') {
      res.status(200).json({
        availableEndpoints: [
          'GET /health',
          'GET /api/status',
          'POST /api/generate-identity',
          'POST /api/shared-links',
          'GET /api/shared-links',
          'GET /api/test-sites',
          'GET /shared/:id'
        ],
        currentRequest: {
          method,
          pathname,
          headers: req.headers
        }
      });
      return;
    }

    console.log(`❌ 404 - Endpoint não encontrado: ${method} ${pathname}`);
    res.status(404).json({ 
      error: 'Endpoint não encontrado',
      method,
      pathname,
      availableEndpoints: [
        '/health',
        '/api/status', 
        '/api/generate-identity',
        '/api/shared-links',
        '/api/test-sites'
      ]
    });
    
  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      message: error.message,
      pathname
    });
  }
};

// Função auxiliar para ler body da requisição
async function getRequestBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch {
        resolve({});
      }
    });
  });
} 