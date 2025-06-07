const path = require('path');

/**
 * Configurações do sistema Phantom Identity
 */
const config = {
  // Configurações do servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || 'localhost',
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  },

  // Configurações de proxy
  proxy: {
    enabled: process.env.PROXY_ENABLED === 'true',
    defaultType: 'socks5',
    timeout: 10000,
    retries: 3,
    testUrl: 'https://httpbin.org/ip',
    rotation: {
      enabled: true,
      interval: 300000 // 5 minutos
    }
  },

  // Configurações de fingerprint
  fingerprint: {
    regenerateInterval: 3600000, // 1 hora
    validation: {
      enabled: true,
      strict: false
    },
    entropy: {
      canvas: true,
      webgl: true,
      audio: true,
      fonts: true
    }
  },

  // Configurações do cliente phantom
  client: {
    maxInstances: 5,
    browserArgs: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-networking',
      '--disable-background-timer-throttling',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-extensions',
      '--no-default-browser-check',
      '--no-first-run',
      '--mute-audio',
      '--disable-notifications',
      '--disable-popup-blocking',
      '--disable-translate',
      '--disable-sync',
      '--disable-background-mode',
      '--disable-client-side-phishing-detection',
      '--disable-hang-monitor',
      '--disable-prompt-on-repost',
      '--disable-domain-reliability',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection'
    ],
    ignoreArgs: [
      '--enable-automation',
      '--enable-blink-features=IdleDetection'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    },
    userAgent: {
      chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
      safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15'
    }
  },

  // Configurações de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: {
      enabled: false,
      path: path.join(__dirname, '../logs'),
      maxSize: '10MB',
      maxFiles: 5
    },
    console: {
      enabled: true,
      colors: true,
      timestamp: true
    }
  },

  // Configurações de segurança
  security: {
    rateLimit: {
      enabled: true,
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 100 // máximo 100 requests por IP
    },
    encryption: {
      algorithm: 'aes-256-gcm',
      keyLength: 32
    },
    headers: {
      hsts: true,
      noSniff: true,
      xssProtection: true,
      frameOptions: 'DENY'
    }
  },

  // Configurações de performance
  performance: {
    cache: {
      enabled: true,
      ttl: 300, // 5 minutos
      max: 1000 // máximo 1000 itens
    },
    compression: {
      enabled: true,
      level: 6
    },
    timeout: {
      request: 30000,
      socket: 10000
    }
  },

  // Sites de teste padrão
  testSites: [
    {
      name: 'FingerprintJS',
      url: 'https://fingerprint.com/demo',
      category: 'fingerprint',
      description: 'Teste de detecção de fingerprint',
      timeout: 30000
    },
    {
      name: 'Whoer',
      url: 'https://whoer.net',
      category: 'ip-detection',
      description: 'Verificação de IP e DNS',
      timeout: 30000
    },
    {
      name: 'IPLeak',
      url: 'https://ipleak.net',
      category: 'ip-leak',
      description: 'Teste de vazamentos de IP',
      timeout: 30000
    },
    {
      name: 'AmIUnique',
      url: 'https://amiunique.org',
      category: 'uniqueness',
      description: 'Análise de unicidade do browser',
      timeout: 30000
    },
    {
      name: 'Cover Your Tracks',
      url: 'https://coveryourtracks.eff.org',
      category: 'tracking',
      description: 'Proteção contra tracking',
      timeout: 30000
    },
    {
      name: 'BrowserLeaks',
      url: 'https://browserleaks.com',
      category: 'comprehensive',
      description: 'Testes abrangentes de privacidade',
      timeout: 45000
    },
    {
      name: 'Device Info',
      url: 'https://www.deviceinfo.me',
      category: 'device',
      description: 'Informações detalhadas do dispositivo',
      timeout: 30000
    }
  ],

  // Configurações de desenvolvimento
  development: {
    debug: process.env.NODE_ENV === 'development',
    mockData: process.env.MOCK_DATA === 'true',
    hotReload: process.env.HOT_RELOAD === 'true'
  },

  // Configurações de produção
  production: {
    minify: true,
    compression: true,
    monitoring: {
      enabled: true,
      interval: 60000 // 1 minuto
    }
  },

  // Configurações específicas do sistema
  system: {
    maxMemoryUsage: '512MB',
    gcInterval: 300000, // 5 minutos
    healthCheck: {
      enabled: true,
      interval: 30000, // 30 segundos
      timeout: 5000
    }
  },

  // Configurações de database (se necessário)
  database: {
    type: 'memory', // ou 'sqlite', 'mongodb', etc.
    connection: {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 27017,
      database: process.env.DB_NAME || 'phantom_identity'
    },
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // Configurações de APIs externas
  apis: {
    geoip: {
      enabled: true,
      provider: 'ipapi',
      apiKey: process.env.GEOIP_API_KEY,
      timeout: 5000
    },
    proxy: {
      providers: [
        {
          name: 'provider1',
          url: process.env.PROXY_PROVIDER_1_URL,
          apiKey: process.env.PROXY_PROVIDER_1_KEY
        }
      ]
    }
  }
};

/**
 * Validação de configuração
 */
function validateConfig() {
  const errors = [];

  // Validar porta
  if (!config.server.port || isNaN(config.server.port)) {
    errors.push('Porta do servidor inválida');
  }

  // Validar configurações de proxy
  if (config.proxy.enabled && !config.proxy.defaultType) {
    errors.push('Tipo de proxy padrão não especificado');
  }

  // Validar configurações de cliente
  if (!config.client.browserArgs || !Array.isArray(config.client.browserArgs)) {
    errors.push('Argumentos do navegador inválidos');
  }

  if (errors.length > 0) {
    console.error('❌ Erros de configuração encontrados:');
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Configuração validada com sucesso');
}

/**
 * Obter configuração por ambiente
 */
function getEnvironmentConfig() {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        ...config,
        logging: { ...config.logging, level: 'warn' },
        development: { ...config.development, debug: false }
      };
    case 'test':
      return {
        ...config,
        server: { ...config.server, port: 0 },
        logging: { ...config.logging, level: 'error' }
      };
    default:
      return config;
  }
}

/**
 * Utilitários de configuração
 */
const configUtils = {
  // Obter User Agent aleatório
  getRandomUserAgent() {
    const agents = Object.values(config.client.userAgent);
    return agents[Math.floor(Math.random() * agents.length)];
  },

  // Obter configurações de proxy
  getProxyConfig(proxyData) {
    return {
      host: proxyData.host,
      port: proxyData.port,
      type: proxyData.type || config.proxy.defaultType,
      timeout: config.proxy.timeout,
      username: proxyData.username,
      password: proxyData.password
    };
  },

  // Obter argumentos do navegador
  getBrowserArgs(additionalArgs = []) {
    return [
      ...config.client.browserArgs,
      ...additionalArgs
    ].filter(arg => !config.client.ignoreArgs.includes(arg));
  },

  // Verificar se está em modo debug
  isDebugMode() {
    return config.development.debug;
  },

  // Obter timeout para operação
  getTimeout(operation = 'default') {
    const timeouts = {
      request: config.performance.timeout.request,
      socket: config.performance.timeout.socket,
      proxy: config.proxy.timeout,
      default: 10000
    };
    return timeouts[operation] || timeouts.default;
  }
};

module.exports = {
  config: getEnvironmentConfig(),
  validateConfig,
  configUtils
};