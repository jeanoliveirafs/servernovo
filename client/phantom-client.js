const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const io = require('socket.io-client');
const chalk = require('chalk');

puppeteer.use(StealthPlugin());

class PhantomClient {
  constructor(serverUrl = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    this.socket = null;
    this.browser = null;
    this.page = null;
    this.phantomIdentity = null;
    this.isConnected = false;
    this.isReady = false;
    
    console.log(chalk.blue('🎭 Phantom Client inicializando...'));
  }

  async connect() {
    console.log(chalk.yellow('🔌 Conectando ao servidor...'));
    
    this.socket = io(this.serverUrl, {
      timeout: 10000,
      retries: 3
    });
    
    this.socket.on('connect', () => {
      console.log(chalk.green('✅ Conectado ao servidor Phantom Identity'));
      this.isConnected = true;
      this.socket.emit('client-status', 'connected');
    });

    this.socket.on('phantom-identity', (identity) => {
      console.log(chalk.magenta('🎭 Identidade phantom recebida:'), identity.id);
      this.phantomIdentity = identity;
      if (this.browser && this.page) {
        this.updateBrowserIdentity();
      }
    });

    this.socket.on('identity-update', (identity) => {
      console.log(chalk.cyan('🔄 Identidade phantom atualizada:'), identity.id);
      this.phantomIdentity = identity;
      this.updateBrowserIdentity();
    });

    this.socket.on('execute-action', (action) => {
      console.log(chalk.blue(`⚡ Executando ação sincronizada: ${action.type}`));
      this.executeAction(action);
    });

    this.socket.on('disconnect', () => {
      console.log(chalk.red('❌ Desconectado do servidor'));
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error(chalk.red('❌ Erro de conexão:'), error.message);
    });

    // Aguardar conexão
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timeout na conexão com o servidor'));
      }, 10000);

      this.socket.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async launchBrowser() {
    console.log(chalk.yellow('🚀 Iniciando navegador phantom...'));
    
    const proxyArgs = this.phantomIdentity?.proxy ? 
      [`--proxy-server=${this.phantomIdentity.proxy.type}://${this.phantomIdentity.proxy.host}:${this.phantomIdentity.proxy.port}`] : 
      [];

    try {
      this.browser = await puppeteer.launch({
        headless: false,
        devtools: false,
        defaultViewport: null,
        args: [
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
          '--disable-ipc-flooding-protection',
          ...proxyArgs
        ],
        ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=IdleDetection'],
        ignoreHTTPSErrors: true
      });

      this.page = await this.browser.newPage();
      
      // Configurar viewport baseado na identidade
      if (this.phantomIdentity?.fingerprint?.screen) {
        const { width, height } = this.phantomIdentity.fingerprint.screen;
        await this.page.setViewport({ width, height });
      }

      // Aplicar fingerprint
      await this.setupFingerprint();
      
      // Configurar interceptadores
      await this.setupInterceptors();
      
      console.log(chalk.green('✅ Navegador phantom configurado com sucesso'));
      this.isReady = true;
      
      if (this.socket && this.isConnected) {
        this.socket.emit('client-status', 'ready');
      }
      
      return this.browser;
    } catch (error) {
      console.error(chalk.red('❌ Erro ao iniciar navegador:'), error);
      throw error;
    }
  }

  async setupFingerprint() {
    if (!this.phantomIdentity || !this.page) return;
    
    console.log(chalk.yellow('🎭 Aplicando fingerprint phantom...'));
    const { fingerprint } = this.phantomIdentity;

    // Script de fingerprint spoofing
    await this.page.evaluateOnNewDocument((fp) => {
      // Navigator properties
      Object.defineProperty(navigator, 'userAgent', {
        get: () => fp.userAgent,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'platform', {
        get: () => fp.platform,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'languages', {
        get: () => fp.languages,
        configurable: true
      });
      
      Object.defineProperty(navigator, 'language', {
        get: () => fp.languages[0],
        configurable: true
      });
      
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => fp.hardware.concurrency,
        configurable: true
      });

      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => fp.hardware.deviceMemory,
        configurable: true
      });

      // Geolocation spoofing
      Object.defineProperty(navigator, 'geolocation', {
        get: () => ({
          getCurrentPosition: (success, error, options) => {
            setTimeout(() => {
              success({
                coords: {
                  latitude: fp.geolocation.latitude,
                  longitude: fp.geolocation.longitude,
                  accuracy: fp.geolocation.accuracy,
                  altitude: null,
                  altitudeAccuracy: null,
                  heading: null,
                  speed: null
                },
                timestamp: Date.now()
              });
            }, 100);
          },
          watchPosition: (success, error, options) => {
            return this.getCurrentPosition(success, error, options);
          },
          clearWatch: () => {}
        }),
        configurable: true
      });

      // Timezone spoofing
      const originalDateGetTimezoneOffset = Date.prototype.getTimezoneOffset;
      Date.prototype.getTimezoneOffset = function() {
        const timezones = {
          'America/Sao_Paulo': 180,
          'America/New_York': 300,
          'Europe/London': 0,
          'Asia/Tokyo': -540,
          'Australia/Sydney': -660
        };
        return timezones[fp.timezone] || 180;
      };

      // Screen properties
      Object.defineProperty(screen, 'width', { 
        get: () => fp.screen.width,
        configurable: true 
      });
      Object.defineProperty(screen, 'height', { 
        get: () => fp.screen.height,
        configurable: true 
      });
      Object.defineProperty(screen, 'colorDepth', { 
        get: () => fp.screen.colorDepth,
        configurable: true 
      });
      Object.defineProperty(screen, 'pixelDepth', { 
        get: () => fp.screen.pixelDepth,
        configurable: true 
      });

      // WebRTC blocking
      const rtcPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection;
      if (rtcPeerConnection) {
        window.RTCPeerConnection = function(...args) {
          const pc = new rtcPeerConnection(...args);
          const originalCreateDataChannel = pc.createDataChannel;
          pc.createDataChannel = function() {
            return originalCreateDataChannel.apply(pc, arguments);
          };
          return pc;
        };
      }

      // Canvas fingerprint spoofing
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) {
        const context = getContext.apply(this, [type, ...args]);
        
        if (type === '2d' && context) {
          const getImageData = context.getImageData;
          context.getImageData = function(...args) {
            const imageData = getImageData.apply(this, args);
            // Adicionar ruído consistente baseado no fingerprint
            const hash = fp.canvas.split('_')[1] || '0';
            const noise = parseInt(hash.substring(0, 2), 16) % 10;
            
            for (let i = 0; i < imageData.data.length; i += 4) {
              imageData.data[i] = (imageData.data[i] + noise) % 256;
            }
            return imageData;
          };
        }
        
        return context;
      };

      // WebGL spoofing
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        const webgl = fp.webgl;
        
        if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
          return webgl.vendor;
        }
        if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
          return webgl.renderer;
        }
        
        return getParameter.apply(this, arguments);
      };

      // Battery API spoofing
      if (navigator.getBattery) {
        navigator.getBattery = () => Promise.resolve({
          charging: fp.battery.charging,
          chargingTime: fp.battery.chargingTime,
          dischargingTime: fp.battery.dischargingTime,
          level: fp.battery.level,
          addEventListener: () => {},
          removeEventListener: () => {}
        });
      }

      // Connection API spoofing
      if (navigator.connection) {
        Object.defineProperty(navigator, 'connection', {
          get: () => ({
            effectiveType: fp.connection.effectiveType,
            type: fp.connection.type,
            downlink: fp.connection.downlink,
            rtt: fp.connection.rtt,
            saveData: fp.connection.saveData,
            addEventListener: () => {},
            removeEventListener: () => {}
          }),
          configurable: true
        });
      }

      // Font detection prevention
      const originalOffsetWidth = HTMLElement.prototype.offsetWidth;
      const originalOffsetHeight = HTMLElement.prototype.offsetHeight;
      
      // Plugins spoofing
      Object.defineProperty(navigator, 'plugins', {
        get: () => ({
          length: fp.plugins.length,
          ...fp.plugins.reduce((acc, plugin, index) => {
            acc[index] = {
              name: plugin.name,
              filename: plugin.filename,
              description: plugin.name,
              version: '1.0.0'
            };
            return acc;
          }, {}),
          namedItem: (name) => fp.plugins.find(p => p.name === name) || null,
          refresh: () => {}
        }),
        configurable: true
      });

      console.log('🎭 Fingerprint phantom aplicado com sucesso');
    }, fingerprint);

    console.log(chalk.green('✅ Fingerprint aplicado com sucesso'));
  }

  async setupInterceptors() {
    if (!this.page) return;

    // Interceptar requests para adicionar headers customizados
    await this.page.setRequestInterception(true);
    
    this.page.on('request', (request) => {
      const headers = {
        ...request.headers(),
        'Accept-Language': this.phantomIdentity?.fingerprint?.languages?.join(',') || 'pt-BR,pt;q=0.9,en;q=0.8',
        'Sec-CH-UA-Platform': `"${this.phantomIdentity?.fingerprint?.platform || 'Windows'}"`,
        'Sec-CH-UA-Mobile': '?0'
      };

      request.continue({ headers });
    });

    // Log de navegação
    this.page.on('load', () => {
      console.log(chalk.cyan(`📄 Página carregada: ${this.page.url()}`));
    });

    this.page.on('error', (error) => {
      console.error(chalk.red('❌ Erro na página:'), error.message);
    });
  }

  async updateBrowserIdentity() {
    if (this.page && this.phantomIdentity) {
      await this.setupFingerprint();
      console.log(chalk.green('🔄 Identidade atualizada no navegador'));
    }
  }

  async executeAction(action) {
    if (!this.page || !this.isReady) {
      console.log(chalk.yellow('⚠️ Navegador não está pronto para executar ações'));
      return;
    }

    try {
      console.log(chalk.blue(`⚡ Executando: ${action.type}`));
      
      switch (action.type) {
        case 'navigate':
          await this.page.goto(action.url, { 
            waitUntil: 'networkidle2',
            timeout: 30000 
          });
          break;
          
        case 'click':
          await this.page.waitForSelector(action.selector, { timeout: 10000 });
          await this.page.click(action.selector);
          break;
          
        case 'type':
          await this.page.waitForSelector(action.selector, { timeout: 10000 });
          await this.page.type(action.selector, action.text, {
            delay: this.getRandomDelay()
          });
          break;
          
        case 'scroll':
          await this.page.evaluate((pixels) => {
            window.scrollBy(0, pixels);
          }, action.pixels || 100);
          break;
          
        case 'wait':
          await this.page.waitForTimeout(action.duration || 1000);
          break;
          
        case 'test-fingerprint':
          await this.testFingerprint();
          break;
          
        case 'sync-all':
          console.log(chalk.cyan('🔄 Sincronização forçada recebida'));
          if (this.socket && this.isConnected) {
            this.socket.emit('client-status', 'synced');
          }
          break;
          
        default:
          console.log(chalk.yellow(`⚠️ Ação não reconhecida: ${action.type}`));
      }
      
      console.log(chalk.green(`✅ Ação ${action.type} executada com sucesso`));
      
    } catch (error) {
      console.error(chalk.red(`❌ Erro executando ação ${action.type}:`), error.message);
    }
  }

  async testFingerprint() {
    if (!this.page) return;

    try {
      console.log(chalk.yellow('🧪 Iniciando teste de fingerprint...'));
      
      // Navegar para site de teste
      await this.page.goto('https://fingerprint.com/demo', { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Aguardar carregamento
      await this.page.waitForTimeout(3000);

      // Extrair informações do fingerprint
      const fingerprintData = await this.page.evaluate(() => {
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          languages: navigator.languages,
          hardwareConcurrency: navigator.hardwareConcurrency,
          deviceMemory: navigator.deviceMemory,
          screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
          },
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          url: window.location.href
        };
      });

      console.log(chalk.green('🧪 Teste de fingerprint concluído'));
      console.log(chalk.cyan('📊 Dados coletados:'), fingerprintData);

      // Enviar resultados para o servidor
      if (this.socket && this.isConnected) {
        this.socket.emit('fingerprint-test', fingerprintData);
      }

    } catch (error) {
      console.error(chalk.red('❌ Erro no teste de fingerprint:'), error.message);
    }
  }

  getRandomDelay() {
    const { behavior } = this.phantomIdentity || {};
    const min = behavior?.typingSpeed?.min || 100;
    const max = behavior?.typingSpeed?.max || 300;
    return Math.random() * (max - min) + min;
  }

  async syncAction(type, data) {
    if (this.isConnected && this.socket) {
      this.socket.emit('sync-action', { 
        type, 
        ...data, 
        timestamp: Date.now(),
        clientId: this.socket.id
      });
      console.log(chalk.cyan(`🔄 Ação sincronizada: ${type}`));
    }
  }

  async close() {
    console.log(chalk.yellow('🛑 Encerrando Phantom Client...'));
    
    if (this.browser) {
      await this.browser.close();
      console.log(chalk.green('✅ Navegador fechado'));
    }
    
    if (this.socket) {
      this.socket.disconnect();
      console.log(chalk.green('✅ Conexão WebSocket fechada'));
    }
  }

  // Método para executar script customizado
  async executeScript(script) {
    if (!this.page) return null;
    
    try {
      const result = await this.page.evaluate(script);
      console.log(chalk.green('✅ Script customizado executado'));
      return result;
    } catch (error) {
      console.error(chalk.red('❌ Erro executando script:'), error.message);
      throw error;
    }
  }

  // Método para captura de screenshot
  async takeScreenshot(options = {}) {
    if (!this.page) return null;
    
    try {
      const screenshot = await this.page.screenshot({
        fullPage: true,
        type: 'png',
        ...options
      });
      console.log(chalk.green('📸 Screenshot capturado'));
      return screenshot;
    } catch (error) {
      console.error(chalk.red('❌ Erro capturando screenshot:'), error.message);
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const client = new PhantomClient();
  
  async function start() {
    try {
      console.log(chalk.blue('🎭 Iniciando Phantom Client...'));
      
      await client.connect();
      await client.launchBrowser();
      
      console.log(chalk.green('🎭 Phantom Client iniciado com sucesso!'));
      console.log(chalk.cyan('📋 Comandos disponíveis:'));
      console.log(chalk.white('  - O cliente está conectado e pronto para receber comandos'));
      console.log(chalk.white('  - Use o dashboard web para controlar o cliente'));
      console.log(chalk.white('  - Pressione Ctrl+C para encerrar'));
      
      // Manter o processo vivo
      process.stdin.resume();
      
    } catch (error) {
      console.error(chalk.red('❌ Erro iniciando Phantom Client:'), error);
      process.exit(1);
    }
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n🛑 Encerrando Phantom Client...'));
    await client.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log(chalk.yellow('\n🛑 Encerrando Phantom Client...'));
    await client.close();
    process.exit(0);
  });

  start();
}

module.exports = PhantomClient;