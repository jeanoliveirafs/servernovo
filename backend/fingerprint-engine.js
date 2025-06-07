const crypto = require('crypto');
const chalk = require('chalk');

class FingerprintEngine {
  constructor() {
    this.stats = {
      generated: 0,
      lastGenerated: null
    };
    
    this.userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
    ];
    
    this.platforms = ['Win32', 'MacIntel', 'Linux x86_64'];
    this.languages = [
      ['pt-BR', 'pt', 'en'],
      ['en-US', 'en'],
      ['es-ES', 'es', 'en'],
      ['fr-FR', 'fr', 'en']
    ];
    
    this.timezones = [
      'America/Sao_Paulo',
      'America/New_York',
      'Europe/London',
      'Asia/Tokyo',
      'Australia/Sydney'
    ];
    
    this.screens = [
      { width: 1920, height: 1080, colorDepth: 24, pixelDepth: 24 },
      { width: 1366, height: 768, colorDepth: 24, pixelDepth: 24 },
      { width: 1440, height: 900, colorDepth: 24, pixelDepth: 24 },
      { width: 2560, height: 1440, colorDepth: 24, pixelDepth: 24 }
    ];
    
    this.gpus = [
      'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'Apple GPU',
      'Mali-G76 MP16'
    ];
  }

  generateFingerprint() {
    const fingerprint = {
      userAgent: this.getRandomUserAgent(),
      platform: this.getRandomPlatform(),
      languages: this.getRandomLanguages(),
      timezone: this.getRandomTimezone(),
      geolocation: this.generateGeolocation(),
      screen: this.getRandomScreen(),
      hardware: this.generateHardware(),
      canvas: this.generateCanvasFingerprint(),
      webgl: this.generateWebGLFingerprint(),
      audio: this.generateAudioFingerprint(),
      fonts: this.generateFontList(),
      plugins: this.generatePluginList(),
      webrtc: this.generateWebRTCFingerprint(),
      battery: this.generateBatteryInfo(),
      connection: this.generateConnectionInfo()
    };
    
    this.stats.generated++;
    this.stats.lastGenerated = new Date();
    
    console.log(chalk.green(`🎭 Novo fingerprint gerado (Total: ${this.stats.generated})`));
    return fingerprint;
  }

  getRandomUserAgent() {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  getRandomPlatform() {
    return this.platforms[Math.floor(Math.random() * this.platforms.length)];
  }

  getRandomLanguages() {
    return this.languages[Math.floor(Math.random() * this.languages.length)];
  }

  getRandomTimezone() {
    return this.timezones[Math.floor(Math.random() * this.timezones.length)];
  }

  getRandomScreen() {
    return this.screens[Math.floor(Math.random() * this.screens.length)];
  }

  generateGeolocation() {
    // Coordenadas aleatórias em áreas urbanas populares
    const locations = [
      { latitude: -23.5505, longitude: -46.6333, city: 'São Paulo' },
      { latitude: 40.7128, longitude: -74.0060, city: 'New York' },
      { latitude: 51.5074, longitude: -0.1278, city: 'London' },
      { latitude: 35.6762, longitude: 139.6503, city: 'Tokyo' },
      { latitude: -33.8688, longitude: 151.2093, city: 'Sydney' }
    ];
    
    const location = locations[Math.floor(Math.random() * locations.length)];
    return {
      latitude: location.latitude + (Math.random() - 0.5) * 0.1,
      longitude: location.longitude + (Math.random() - 0.5) * 0.1,
      accuracy: 20 + Math.random() * 100,
      city: location.city
    };
  }

  generateHardware() {
    return {
      concurrency: [2, 4, 8, 12, 16][Math.floor(Math.random() * 5)],
      memory: [2, 4, 8, 16, 32][Math.floor(Math.random() * 5)],
      gpu: this.gpus[Math.floor(Math.random() * this.gpus.length)],
      deviceMemory: [0.25, 0.5, 1, 2, 4, 8][Math.floor(Math.random() * 6)]
    };
  }

  generateCanvasFingerprint() {
    // Gerar um hash único mas consistente para o canvas
    const seed = crypto.randomBytes(16).toString('hex');
    const hash = crypto.createHash('md5').update(seed).digest('hex');
    return `canvas_${hash}`;
  }

  generateWebGLFingerprint() {
    const vendors = ['Google Inc. (Intel)', 'Google Inc. (NVIDIA)', 'Google Inc. (AMD)', 'Apple Inc.'];
    const renderers = [
      'ANGLE (Intel, Intel(R) HD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (NVIDIA, NVIDIA GeForce GTX 1060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
      'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)'
    ];
    
    return {
      vendor: vendors[Math.floor(Math.random() * vendors.length)],
      renderer: renderers[Math.floor(Math.random() * renderers.length)],
      version: 'WebGL 1.0 (OpenGL ES 2.0 Chromium)',
      extensions: this.generateWebGLExtensions(),
      parameters: this.generateWebGLParameters()
    };
  }

  generateWebGLExtensions() {
    const extensions = [
      'WEBKIT_EXT_texture_filter_anisotropic',
      'EXT_texture_filter_anisotropic',
      'WEBKIT_WEBGL_compressed_texture_s3tc',
      'WEBGL_compressed_texture_s3tc',
      'WEBGL_depth_texture',
      'OES_element_index_uint',
      'EXT_blend_minmax'
    ];
    
    const count = 3 + Math.floor(Math.random() * 4);
    return extensions.slice(0, count);
  }

  generateWebGLParameters() {
    return {
      maxTextureSize: [2048, 4096, 8192, 16384][Math.floor(Math.random() * 4)],
      maxVertexAttribs: 16,
      maxVertexUniformVectors: [1024, 2048, 4096][Math.floor(Math.random() * 3)],
      maxFragmentUniformVectors: [1024, 2048, 4096][Math.floor(Math.random() * 3)]
    };
  }

  generateAudioFingerprint() {
    return {
      sampleRate: [22050, 44100, 48000][Math.floor(Math.random() * 3)],
      maxChannelCount: [1, 2, 6, 8][Math.floor(Math.random() * 4)],
      numberOfInputs: Math.floor(Math.random() * 3) + 1,
      numberOfOutputs: Math.floor(Math.random() * 3) + 1,
      channelCount: [1, 2][Math.floor(Math.random() * 2)],
      baseLatency: Math.random() * 0.01,
      outputLatency: Math.random() * 0.02
    };
  }

  generateFontList() {
    const commonFonts = [
      'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Verdana',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Arial Black', 'Impact', 'Lucida Sans Unicode',
      'Tahoma', 'Monaco', 'Consolas', 'Lucida Console'
    ];
    
    const systemFonts = [
      'Calibri', 'Cambria', 'Segoe UI', 'Microsoft Sans Serif',
      'San Francisco', 'Helvetica Neue', 'Ubuntu', 'Roboto'
    ];
    
    const fonts = [...commonFonts];
    
    // Adicionar algumas fontes do sistema aleatoriamente
    systemFonts.forEach(font => {
      if (Math.random() > 0.5) {
        fonts.push(font);
      }
    });
    
    return fonts.sort();
  }

  generatePluginList() {
    const plugins = [];
    
    const possiblePlugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
      { name: 'Chromium PDF Plugin', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
      { name: 'Microsoft Edge PDF Plugin', filename: 'pdf' },
      { name: 'WebKit built-in PDF', filename: 'pdf' }
    ];
    
    possiblePlugins.forEach(plugin => {
      if (Math.random() > 0.3) {
        plugins.push(plugin);
      }
    });
    
    return plugins;
  }

  generateWebRTCFingerprint() {
    return {
      localIP: this.generateLocalIP(),
      stunServers: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302'
      ],
      iceConnectionState: 'new',
      iceGatheringState: 'new'
    };
  }

  generateLocalIP() {
    return `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  generateBatteryInfo() {
    return {
      charging: Math.random() > 0.5,
      chargingTime: Math.random() > 0.5 ? Infinity : Math.floor(Math.random() * 7200),
      dischargingTime: Math.random() > 0.5 ? Infinity : Math.floor(Math.random() * 28800),
      level: Math.random()
    };
  }

  generateConnectionInfo() {
    const types = ['wifi', 'cellular', 'ethernet', 'bluetooth'];
    const effectiveTypes = ['slow-2g', '2g', '3g', '4g'];
    
    return {
      effectiveType: effectiveTypes[Math.floor(Math.random() * effectiveTypes.length)],
      type: types[Math.floor(Math.random() * types.length)],
      downlink: Math.random() * 10 + 1,
      rtt: Math.floor(Math.random() * 300) + 50,
      saveData: Math.random() > 0.8
    };
  }

  getStats() {
    return this.stats;
  }

  // Método para validar se um fingerprint é realístico
  validateFingerprint(fingerprint) {
    const issues = [];
    
    // Verificar consistência entre User Agent e Platform
    if (fingerprint.userAgent.includes('Windows') && fingerprint.platform !== 'Win32') {
      issues.push('User Agent e Platform inconsistentes');
    }
    
    // Verificar se timezone bate com idiomas
    if (fingerprint.languages.includes('pt-BR') && !fingerprint.timezone.includes('America')) {
      issues.push('Timezone não condiz com idioma brasileiro');
    }
    
    // Verificar resolução da tela
    if (fingerprint.screen.width < 800 || fingerprint.screen.height < 600) {
      issues.push('Resolução de tela muito baixa');
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}

module.exports = FingerprintEngine;