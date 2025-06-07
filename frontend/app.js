class PhantomDashboard {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.phantomIdentity = null;
    this.autoScroll = true;
    this.logCount = 0;
    this.maxLogs = 100;

    this.init();
  }

  init() {
    this.connectWebSocket();
    this.setupEventListeners();
    this.loadTestSites();
    this.startStatusUpdater();
  }

  connectWebSocket() {
    console.log('🔌 Conectando ao WebSocket...');
    this.socket = io();

    this.socket.on('connect', () => {
      console.log('✅ WebSocket conectado');
      this.isConnected = true;
      this.updateConnectionStatus(true);
      this.addLog('WebSocket conectado com sucesso', 'success');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket desconectado');
      this.isConnected = false;
      this.updateConnectionStatus(false);
      this.addLog('WebSocket desconectado', 'error');
    });

    this.socket.on('phantom-identity', (identity) => {
      console.log('🎭 Identidade phantom recebida:', identity);
      this.phantomIdentity = identity;
      this.updateIdentityDisplay();
      this.addLog(`Identidade phantom carregada: ${identity.id}`, 'info');
    });

    this.socket.on('identity-update', (identity) => {
      console.log('🔄 Identidade phantom atualizada:', identity);
      this.phantomIdentity = identity;
      this.updateIdentityDisplay();
      this.addLog(`Identidade phantom atualizada: ${identity.id}`, 'info');
    });

    this.socket.on('clients-update', (clients) => {
      console.log('👥 Lista de clientes atualizada:', clients);
      this.updateClientsList(clients);
    });

    this.socket.on('new-log', (logData) => {
      this.addLog(logData.message, logData.type, logData.clientId);
    });

    this.socket.on('test-results', (data) => {
      console.log('🧪 Resultados de teste recebidos:', data);
      this.addLog(`Teste completado por cliente ${data.clientId}`, 'success');
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão:', error);
      this.addLog(`Erro de conexão: ${error.message}`, 'error');
    });
  }

  setupEventListeners() {
    // Controles principais
    document.getElementById('sync-all').addEventListener('click', () => this.syncAllClients());
    document.getElementById('test-fingerprint').addEventListener('click', () => this.testFingerprint());
    document.getElementById('generate-identity').addEventListener('click', () => this.generateNewIdentity());
    document.getElementById('test-proxy').addEventListener('click', () => this.testProxy());
    document.getElementById('clear-logs').addEventListener('click', () => this.clearLogs());

    // Links compartilhados
    document.getElementById('generate-link').addEventListener('click', () => this.generateSharedLink());
    document.getElementById('copy-link').addEventListener('click', () => this.copyLinkToClipboard());

    // Auto-scroll toggle
    document.getElementById('auto-scroll').addEventListener('change', (e) => {
      this.autoScroll = e.target.checked;
    });

    // Solicitar identidade ao conectar
    if (this.socket && this.socket.connected) {
      this.socket.emit('request-identity');
    }

    // Carregar links ativos
    this.loadActiveLinks();
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (connected) {
      statusElement.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-300';
      statusElement.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>Conectado';
    } else {
      statusElement.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900 text-red-300';
      statusElement.innerHTML = '<div class="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>Desconectado';
    }
  }

  updateIdentityDisplay() {
    if (!this.phantomIdentity) return;

    const { fingerprint, proxy, id } = this.phantomIdentity;

    // Informações básicas
    document.getElementById('phantom-id').textContent = id;
    document.getElementById('proxy-ip').textContent = `${proxy.host}:${proxy.port}`;
    document.getElementById('user-agent').textContent = fingerprint.userAgent;
    document.getElementById('timezone').textContent = fingerprint.timezone;
    document.getElementById('languages').textContent = fingerprint.languages.join(', ');

    // Hardware info
    document.getElementById('cpu-cores').textContent = fingerprint.hardware.concurrency;
    document.getElementById('memory-info').textContent = `${fingerprint.hardware.memory}GB`;
    document.getElementById('gpu-info').textContent = fingerprint.hardware.gpu;
    document.getElementById('screen-info').textContent = `${fingerprint.screen.width}x${fingerprint.screen.height}`;

    // Network & Location
    const location = fingerprint.geolocation;
    document.getElementById('location-info').textContent = location.city || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
    document.getElementById('connection-info').textContent = `${fingerprint.connection.effectiveType} (${fingerprint.connection.type})`;
    document.getElementById('webrtc-ip').textContent = fingerprint.webrtc.localIP;
    document.getElementById('dns-info').textContent = 'Não detectado';
  }

  updateClientsList(clients) {
    const clientsList = document.getElementById('clients-list');
    document.getElementById('client-count').textContent = clients.length;

    if (clients.length === 0) {
      clientsList.innerHTML = '<p class="text-gray-400 text-sm">Nenhum cliente conectado</p>';
      return;
    }

    clientsList.innerHTML = clients.map(client => `
      <div class="bg-gray-700 rounded px-3 py-2 text-sm">
        <div class="flex justify-between items-center">
          <span class="text-white">${client.id.substring(0, 8)}...</span>
          <span class="status-badge ${client.status}">${client.status}</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Conectado: ${new Date(client.connectedAt).toLocaleTimeString()}
        </div>
      </div>
    `).join('');
  }

  async loadTestSites() {
    try {
      const response = await fetch('/api/test-sites');
      const sites = await response.json();
      
      const testSitesContainer = document.getElementById('test-sites');
      testSitesContainer.innerHTML = sites.map(site => `
        <div class="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors border border-gray-600">
          <h3 class="font-semibold text-white mb-2">${site.name}</h3>
          <p class="text-xs text-gray-400 mb-3">${site.description}</p>
          <div class="flex justify-between items-center">
            <span class="text-xs px-2 py-1 rounded bg-blue-900 text-blue-300">${site.category}</span>
            <button onclick="window.open('${site.url}', '_blank')" 
                    class="text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded transition">
              Abrir
            </button>
          </div>
        </div>
      `).join('');
    } catch (error) {
      console.error('Erro ao carregar sites de teste:', error);
      this.addLog('Erro ao carregar sites de teste', 'error');
    }
  }

  async startStatusUpdater() {
    const updateStatus = async () => {
      try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        document.getElementById('uptime').textContent = this.formatUptime(status.uptime);
        document.getElementById('proxy-count').textContent = `${status.proxies?.active || 0}/${status.proxies?.total || 0}`;
        
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    };

    // Atualizar a cada 5 segundos
    setInterval(updateStatus, 5000);
    updateStatus(); // Primeira execução
  }

  syncAllClients() {
    if (!this.isConnected) {
      this.addLog('Não é possível sincronizar - WebSocket desconectado', 'error');
      return;
    }

    this.socket.emit('sync-action', {
      type: 'sync-all',
      timestamp: Date.now(),
      data: { force: true }
    });

    this.addLog('Comando de sincronização enviado para todos os clientes', 'info');
  }

  testFingerprint() {
    if (!this.isConnected) {
      this.addLog('Não é possível testar - WebSocket desconectado', 'error');
      return;
    }

    this.socket.emit('sync-action', {
      type: 'test-fingerprint',
      timestamp: Date.now(),
      url: 'https://fingerprint.com/demo'
    });

    this.addLog('Teste de fingerprint iniciado', 'info');
  }

  async generateNewIdentity() {
    try {
      const response = await fetch('/api/generate-identity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        this.addLog(`Nova identidade gerada: ${result.identity.id}`, 'success');
      } else {
        this.addLog('Erro ao gerar nova identidade', 'error');
      }
    } catch (error) {
      console.error('Erro ao gerar identidade:', error);
      this.addLog('Erro ao gerar nova identidade', 'error');
    }
  }

  async testProxy() {
    if (!this.phantomIdentity?.proxy) {
      this.addLog('Nenhum proxy configurado para testar', 'warning');
      return;
    }

    try {
      this.addLog('Testando proxy...', 'info');
      
      const response = await fetch('/api/proxy/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          proxy: this.phantomIdentity.proxy
        })
      });

      const result = await response.json();
      
      if (result.success) {
        this.addLog(`Proxy OK - IP: ${result.result.ip} (${result.result.responseTime}ms)`, 'success');
      } else {
        this.addLog(`Proxy falhou: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao testar proxy:', error);
      this.addLog('Erro ao testar proxy', 'error');
    }
  }

  clearLogs() {
    const logsContainer = document.getElementById('logs');
    logsContainer.innerHTML = '';
    this.logCount = 0;
    this.addLog('Logs limpos', 'info');
  }

  addLog(message, type = 'info', clientId = null) {
    const logsContainer = document.getElementById('logs');
    const timestamp = new Date().toLocaleTimeString();
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    
    const clientInfo = clientId ? ` [${clientId.substring(0, 8)}]` : '';
    logEntry.innerHTML = `
      <span class="timestamp">[${timestamp}]</span>
      <span class="log-type">[${type.toUpperCase()}]</span>${clientInfo}
      <span class="log-message">${message}</span>
    `;

    logsContainer.appendChild(logEntry);
    this.logCount++;

    // Limitar número de logs
    if (this.logCount > this.maxLogs) {
      const firstChild = logsContainer.firstChild;
      if (firstChild) {
        logsContainer.removeChild(firstChild);
        this.logCount--;
      }
    }

    // Auto-scroll
    if (this.autoScroll) {
      logsContainer.scrollTop = logsContainer.scrollHeight;
    }
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // ============ LINKS COMPARTILHADOS ============

  async generateSharedLink() {
    const targetUrl = document.getElementById('target-url').value;
    const expiresIn = document.getElementById('link-expiry').value;
    const allowMobile = document.getElementById('allow-mobile').checked;

    if (!targetUrl) {
      this.addLog('URL de destino é obrigatória', 'error');
      return;
    }

    // Validar URL
    try {
      new URL(targetUrl);
    } catch (error) {
      this.addLog('URL inválida', 'error');
      return;
    }

    const generateBtn = document.getElementById('generate-link');
    const originalText = generateBtn.innerHTML;
    generateBtn.innerHTML = '<span class="mr-2">⏳</span>Gerando...';
    generateBtn.disabled = true;

    try {
      const response = await fetch('/api/shared-links/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetUrl,
          expiresIn,
          allowMobile
        })
      });

      const result = await response.json();

      if (result.success) {
        this.displayGeneratedLink(result);
        this.loadActiveLinks();
        this.addLog(`Link compartilhado criado: ${result.shortId}`, 'success');
        
        // Limpar formulário
        document.getElementById('target-url').value = '';
      } else {
        this.addLog(`Erro ao gerar link: ${result.error}`, 'error');
      }
    } catch (error) {
      console.error('Erro ao gerar link:', error);
      this.addLog('Erro ao gerar link compartilhado', 'error');
    } finally {
      generateBtn.innerHTML = originalText;
      generateBtn.disabled = false;
    }
  }

  displayGeneratedLink(linkData) {
    const section = document.getElementById('generated-link-section');
    const fullUrl = `${window.location.origin}${linkData.fullUrl}`;
    
    document.getElementById('generated-link-display').textContent = fullUrl;
    document.getElementById('link-id').textContent = linkData.shortId;
    document.getElementById('shared-ip').textContent = linkData.sharedIP;
    document.getElementById('link-expires').textContent = new Date(linkData.expiresAt).toLocaleString();
    
    section.classList.remove('hidden');
    
    // Scroll para a seção
    section.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async copyLinkToClipboard() {
    const linkText = document.getElementById('generated-link-display').textContent;
    
    try {
      await navigator.clipboard.writeText(linkText);
      
      const copyBtn = document.getElementById('copy-link');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅ Copiado!';
      copyBtn.classList.add('bg-green-600');
      
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.classList.remove('bg-green-600');
      }, 2000);
      
      this.addLog('Link copiado para a área de transferência', 'success');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      this.addLog('Erro ao copiar link', 'error');
    }
  }

  async loadActiveLinks() {
    try {
      const response = await fetch('/api/shared-links/active');
      const result = await response.json();
      
      if (result.success) {
        this.displayActiveLinks(result.links);
      }
    } catch (error) {
      console.error('Erro ao carregar links ativos:', error);
    }
  }

  displayActiveLinks(links) {
    const container = document.getElementById('active-links');
    
    if (links.length === 0) {
      container.innerHTML = '<p class="text-gray-400 text-sm">Nenhum link ativo</p>';
      return;
    }

    container.innerHTML = links.map(link => `
      <div class="bg-gray-600 rounded-lg p-3 border border-gray-500">
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1">
            <div class="text-sm font-medium text-white mb-1">
              ${link.shortId}
            </div>
            <div class="text-xs text-gray-300 break-all">
              ${link.targetUrl}
            </div>
          </div>
          <button 
            onclick="phantomDashboard.copySharedLink('${link.shortId}')"
            class="ml-2 text-xs bg-indigo-600 hover:bg-indigo-700 px-2 py-1 rounded transition"
          >
            📋
          </button>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-gray-400">
          <div>IP: ${link.sharedIP}</div>
          <div>Expira: ${new Date(link.expiresAt).toLocaleDateString()}</div>
        </div>
      </div>
    `).join('');
  }

  async copySharedLink(shortId) {
    const fullUrl = `${window.location.origin}/shared/${shortId}`;
    
    try {
      await navigator.clipboard.writeText(fullUrl);
      this.addLog(`Link ${shortId} copiado`, 'success');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      this.addLog('Erro ao copiar link', 'error');
    }
  }
}

// Inicializar dashboard quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  console.log('🎭 Iniciando Phantom Identity Dashboard...');
  window.phantomDashboard = new PhantomDashboard();
  
  // Auto-reload links ativos a cada 30 segundos
  setInterval(() => {
    phantomDashboard.loadActiveLinks();
  }, 30000);
});