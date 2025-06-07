const { v4: uuidv4 } = require('uuid');
const storage = require('./storage');

// Função para obter IP real do usuário
function getRealIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         req.ip || 
         'unknown';
}

module.exports = async (req, res) => {
  const { method, url } = req;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    // Obter IP real do usuário
    const userRealIP = getRealIP(req);
    
    console.log(`🌐 ${method} ${url} - IP: ${userRealIP}`);

    // Health check
    if (url === '/health' || url === '/api/health') {
      res.status(200).json({
        status: 'ok',
        timestamp: new Date(),
        userIP: userRealIP,
        service: 'Phantom Identity API'
      });
      return;
    }

    // Debug endpoint - mostrar todos os acessos
    if (url === '/debug' || url === '/api/debug') {
      const allLinks = storage.getAllSharedLinks();
      const linksArray = Array.from(allLinks.entries()).map(([id, link]) => ({
        id,
        name: link.name,
        uses: link.uses,
        phantomIP: link.phantomIdentity.proxy.ip,
        accessLog: link.accessLog || [],
        createdAt: link.createdAt,
        active: link.active
      }));

      res.status(200).json({
        message: '🔍 Debug - Status dos Links',
        currentUserIP: userRealIP,
        totalLinks: linksArray.length,
        links: linksArray,
        timestamp: new Date()
      });
      return;
    }

    // Gerar identidade phantom brasileira
    if (url === '/identity' || url === '/api/identity') {
      const phantomIdentity = storage.generateBrazilianIdentity();
      
      // Salvar como identidade padrão
      storage.setPhantomIdentity(phantomIdentity);
      
      res.status(200).json({
        success: true,
        identity: phantomIdentity,
        userRealIP,
        message: 'Identidade phantom brasileira gerada com sucesso'
      });
      return;
    }

    // Gerar links compartilhados
    if (url === '/generate-links' || url === '/api/generate-links') {
      const linkId = uuidv4().substring(0, 8);
      const targetUrl = 'https://httpbin.org/json';
      
      const sharedLink = {
        id: linkId,
        name: `Link Compartilhado ${linkId}`,
        targetUrl,
        url: `${req.headers.host || 'localhost'}/shared/${linkId}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        allowMobile: true,
        phantomIdentity: storage.generateBrazilianIdentity(),
        active: true,
        uses: 0,
        accessLog: [],
        createdByIP: userRealIP
      };
      
      // Salvar no storage
      storage.setSharedLink(linkId, sharedLink);
      
      console.log('🔗 Link created:', {
        linkId,
        createdBy: userRealIP,
        phantomIP: sharedLink.phantomIdentity.proxy.ip
      });
      
      res.status(200).json({
        success: true,
        message: 'Link compartilhado gerado com sucesso!',
        link: {
          id: linkId,
          url: sharedLink.url,
          targetUrl,
          phantomIP: sharedLink.phantomIdentity.proxy.ip,
          location: sharedLink.phantomIdentity.proxy.location,
          expiresAt: sharedLink.expiresAt
        },
        createdByIP: userRealIP
      });
      return;
    }

    // Endpoint para testar proxy
    if (url === '/test-proxy' || url === '/api/test-proxy') {
      const phantomIdentity = storage.getPhantomIdentity();
      
      res.status(200).json({
        success: true,
        message: 'Teste de proxy realizado',
        comparison: {
          yourRealIP: userRealIP,
          phantomIP: phantomIdentity.proxy.ip,
          masking: userRealIP !== phantomIdentity.proxy.ip ? 'ATIVO' : 'VERIFICAR',
          location: phantomIdentity.proxy.location,
          userAgent: phantomIdentity.fingerprint.userAgent
        },
        timestamp: new Date()
      });
      return;
    }

    // 404 para outras rotas
    res.status(404).json({
      error: 'Endpoint não encontrado',
      availableEndpoints: [
        '/health - Status da API',
        '/debug - Debug dos links',
        '/identity - Gerar identidade',
        '/generate-links - Gerar links',
        '/test-proxy - Testar proxy'
      ],
      userIP: userRealIP
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      userIP: userRealIP
    });
  }
}; 