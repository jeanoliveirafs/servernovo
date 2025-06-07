// Storage compartilhado para links e identidades
// Em produção, usar Vercel KV ou Redis

let sharedLinks = new Map();
let defaultPhantomIdentity = null;

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

module.exports = {
  // Gerenciar links compartilhados
  getSharedLink: (id) => sharedLinks.get(id),
  setSharedLink: (id, link) => sharedLinks.set(id, link),
  getAllSharedLinks: () => sharedLinks,
  deleteSharedLink: (id) => sharedLinks.delete(id),
  
  // Gerenciar identidade phantom
  getPhantomIdentity: () => {
    if (!defaultPhantomIdentity) {
      defaultPhantomIdentity = generateBrazilianIdentity();
    }
    return defaultPhantomIdentity;
  },
  setPhantomIdentity: (identity) => {
    defaultPhantomIdentity = identity;
  },
  
  // Utilitários
  generateBrazilianIdentity
}; 