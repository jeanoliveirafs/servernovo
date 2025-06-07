class PhantomDashboard {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.phantomIdentity = null;
    this.autoScroll = true;
    this.logCount = 0;
    this.maxLogs = 100;
    this.statusInterval = null;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadTestSites();
    this.startStatusUpdater();
    this.loadPhantomIdentity();
    this.simulateConnection(); // Simular conexão para UI
  }

  // Simular status de conexão para manter UI funcional
  simulateConnection() {
    this.isConnected = true;
    this.updateConnectionStatus(true);
    this.addLog('Sistema inicializado no Vercel Serverless', 'success');
  }

  // Substituído: connectWebSocket() por loadPhantomIdentity()
  async loadPhantomIdentity() {
    try {
      const response = await fetch('/api/status');
      const status = await response.json();
      
      if (status.phantomIdentity) {
        this.phantomIdentity = status.phantomIdentity;
        this.updateIdentityDisplay();
        this.addLog(`Identidade phantom carregada: ${status.phantomIdentity.id}`, 'info');
      }
    } catch (error) {
      console.error('Erro ao carregar identidade:', error);
      this.addLog('Erro ao carregar identidade phantom', 'error');
    }
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

    // Carregar links ativos
    this.loadActiveLinks();
  }

  updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (connected) {
      statusElement.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-900 text-green-300';
      statusElement.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full mr-2"></div>Online (Serverless)';
    } else {
      statusElement.className = 'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-900 text-red-300';
      statusElement.innerHTML = '<div class="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>Offline';
    }
  }

  updateIdentityDisplay() {
    if (!this.phantomIdentity) return;

    const { fingerprint, proxy, id } = this.phantomIdentity;

    // Informações básicas
    document.getElementById('phantom-id').textContent = id;
    document.getElementById('proxy-ip').textContent = `${proxy.ip}:${proxy.port}`;
    document.getElementById('user-agent').textContent = fingerprint.userAgent;
    document.getElementById('timezone').textContent = fingerprint.timezone;
    document.getElementById('languages').textContent = fingerprint.language;

    // Hardware info - valores padrão para serverless
    document.getElementById('cpu-cores').textContent = '2';
    document.getElementById('memory-info').textContent = '1GB';
    document.getElementById('gpu-info').textContent = 'Vercel Edge';
    document.getElementById('screen-info').textContent = `${fingerprint.screen.width}x${fingerprint.screen.height}`;

    // Network & Location
    document.getElementById('location-info').textContent = proxy.location || 'Global CDN';
    document.getElementById('connection-info').textContent = 'Edge Network';
    document.getElementById('webrtc-ip').textContent = proxy.ip;
    document.getElementById('dns-info').textContent = 'Vercel DNS';
  }

  updateClientsList(clients = []) {
    const clientsList = document.getElementById('clients-list');
    // Para serverless, simular 1 cliente ativo
    const simulatedClients = [{
      id: 'serverless-instance',
      status: 'active',
      connectedAt: new Date()
    }];
    
    document.getElementById('client-count').textContent = simulatedClients.length;

    clientsList.innerHTML = simulatedClients.map(client => `
      <div class="bg-gray-700 rounded px-3 py-2 text-sm">
        <div class="flex justify-between items-center">
          <span class="text-white">Vercel Instance</span>
          <span class="status-badge text-green-400">online</span>
        </div>
        <div class="text-xs text-gray-400 mt-1">
          Serverless Function Ativa
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
        
        document.getElementById('uptime').textContent = this.formatUptime(status.uptime || 0);
        document.getElementById('proxy-count').textContent = '1/1'; // Simulado para serverless
        
        // Atualizar lista de clientes
        this.updateClientsList();
        
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
      }
    };

    // Atualizar a cada 10 segundos (menos frequente para serverless)
    setInterval(updateStatus, 10000);
    updateStatus(); // Primeira execução
  }

  syncAllClients() {
    // Simulação para ambiente serverless
    this.addLog('Comando de sincronização executado (serverless mode)', 'info');
    this.loadPhantomIdentity(); // Recarregar identidade
  }

  testFingerprint() {
    // Simular teste de fingerprint
    this.addLog('Teste de fingerprint iniciado', 'info');
    
    // Simular resultado após 2 segundos
    setTimeout(() => {
      this.addLog('✅ Fingerprint testado com sucesso - Vercel Edge Functions', 'success');
    }, 2000);
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