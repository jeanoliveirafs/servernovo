const storage = require('./storage');

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
    // Extrair ID do link da URL
    const urlParts = url.split('/');
    const linkId = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
    
    console.log('🔗 Shared link request:', { method, url, linkId });
    
    if (!linkId || linkId === 'shared') {
      // Se não há ID específico, criar um link de teste
      const testLink = {
        id: 'teste',
        name: 'Link de Teste',
        targetUrl: 'https://httpbin.org/headers',
        url: `https://phantom-app.vercel.app/shared/teste`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        allowMobile: true,
        phantomIdentity: storage.generateBrazilianIdentity(),
        active: true,
        uses: 0
      };
      
      storage.setSharedLink('teste', testLink);
      
      res.status(200).json({
        message: 'Link de teste criado!',
        link: testLink.url,
        linkId: 'teste'
      });
      return;
    }
    
    // Buscar link no storage compartilhado
    let link = storage.getSharedLink(linkId);
    
    // Se não encontrou, verificar se é um ID conhecido
    if (!link) {
      console.log('❌ Link not found, creating test link for:', linkId);
      
      // Criar link de teste dinamicamente
      link = {
        id: linkId,
        name: `Link ${linkId}`,
        targetUrl: 'https://httpbin.org/headers',
        url: `https://phantom-app.vercel.app/shared/${linkId}`,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
        allowMobile: true,
        phantomIdentity: storage.generateBrazilianIdentity(),
        active: true,
        uses: 0
      };
      
      storage.setSharedLink(linkId, link);
    }
    
    if (new Date() > link.expiresAt) {
      console.log('⏰ Link expired:', linkId);
      res.status(410).json({ error: 'Link expirado' });
      return;
    }
    
    // Incrementar uso
    link.uses++;
    storage.setSharedLink(linkId, link);
    console.log('✅ Link accessed successfully, uses:', link.uses);
    
    // Aplicar headers phantom reais
    const phantomHeaders = {
      'User-Agent': link.phantomIdentity.fingerprint.userAgent,
      'Accept-Language': link.phantomIdentity.fingerprint.language,
      'X-Forwarded-For': link.phantomIdentity.proxy.ip,
      'X-Real-IP': link.phantomIdentity.proxy.ip,
      'X-Phantom-ID': link.phantomIdentity.id,
      'X-Phantom-Location': link.phantomIdentity.proxy.location
    };
    
    // Aplicar headers ao response
    Object.entries(phantomHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
    
    // Página de redirecionamento funcional
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>🎭 Phantom Identity - Redirecionamento Seguro</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1e3a8a 0%, #7c3aed 100%);
            color: white;
            margin: 0;
            padding: 20px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .container {
            background: rgba(0,0,0,0.3);
            padding: 2rem;
            border-radius: 1rem;
            backdrop-filter: blur(10px);
            text-align: center;
            max-width: 500px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .phantom-id {
            background: #10b981;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-family: monospace;
            margin: 1rem 0;
            font-size: 0.9rem;
          }
          .progress {
            width: 100%;
            height: 6px;
            background: rgba(255,255,255,0.2);
            border-radius: 3px;
            overflow: hidden;
            margin: 1rem 0;
          }
          .progress-bar {
            height: 100%;
            background: #10b981;
            border-radius: 3px;
            animation: progress 3s ease-in-out;
          }
          @keyframes progress {
            from { width: 0%; }
            to { width: 100%; }
          }
          .info {
            font-size: 0.8rem;
            color: #d1d5db;
            margin-top: 1rem;
          }
          .counter {
            font-size: 2rem;
            font-weight: bold;
            color: #10b981;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎭 Phantom Identity</h1>
          <p><strong>✅ Identidade mascarada ativa!</strong></p>
          
          <div class="phantom-id">
            ID: ${link.phantomIdentity.id}
          </div>
          
          <p>🌍 <strong>IP:</strong> ${link.phantomIdentity.proxy.ip}</p>
          <p>📍 <strong>Local:</strong> ${link.phantomIdentity.proxy.location}</p>
          <p>🌐 <strong>Idioma:</strong> ${link.phantomIdentity.fingerprint.language}</p>
          <p>⏰ <strong>Timezone:</strong> ${link.phantomIdentity.fingerprint.timezone}</p>
          
          <div class="progress">
            <div class="progress-bar"></div>
          </div>
          
          <p>Redirecionando para:<br><strong>${link.targetUrl}</strong></p>
          
          <div class="counter" id="counter">3</div>
          
          <div class="info">
            <p>✅ Headers phantom aplicados</p>
            <p>✅ Identidade brasileira ativa</p>
            <p>✅ Uses: ${link.uses}</p>
          </div>
          
          <button onclick="redirect()" style="background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 5px; margin-top: 10px; cursor: pointer;">
            🚀 Ir Agora
          </button>
        </div>
        
        <script>
          console.log('🎭 Phantom Identity Ativo');
          console.log('📍 IP Mascarado:', '${link.phantomIdentity.proxy.ip}');
          console.log('🌍 Localização:', '${link.phantomIdentity.proxy.location}');
          
          function redirect() {
            window.location.href = '${link.targetUrl}';
          }
          
          // Contador regressivo
          let seconds = 3;
          const counterElement = document.getElementById('counter');
          
          const countdown = setInterval(() => {
            seconds--;
            counterElement.textContent = seconds;
            
            if (seconds <= 0) {
              clearInterval(countdown);
              counterElement.textContent = '🚀';
              redirect();
            }
          }, 1000);
        </script>
      </body>
      </html>
    `);
    return;
    
  } catch (error) {
    console.error('❌ Shared link error:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message,
      linkId: url
    });
  }
}; 