const chalk = require('chalk');

class ProxyManager {
  constructor() {
    this.proxies = [
      {
        id: 'proxy-1',
        host: 'proxy1.example.com',
        port: 1080,
        type: 'socks5',
        username: null,
        password: null,
        country: 'US',
        status: 'active',
        lastTested: null,
        responseTime: null
      },
      {
        id: 'proxy-2',
        host: 'proxy2.example.com',
        port: 8080,
        type: 'http',
        username: null,
        password: null,
        country: 'BR',
        status: 'active',
        lastTested: null,
        responseTime: null
      }
    ];
    
    this.activeProxy = this.proxies[0];
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }

  addProxy(proxyConfig) {
    const proxy = {
      id: `proxy-${Date.now()}`,
      ...proxyConfig,
      status: 'untested',
      lastTested: null,
      responseTime: null
    };
    
    this.proxies.push(proxy);
    console.log(chalk.green(`➕ Proxy adicionado: ${proxy.host}:${proxy.port}`));
    return proxy;
  }

  removeProxy(proxyId) {
    const index = this.proxies.findIndex(p => p.id === proxyId);
    if (index !== -1) {
      const removed = this.proxies.splice(index, 1)[0];
      console.log(chalk.red(`➖ Proxy removido: ${removed.host}:${removed.port}`));
      
      // Se o proxy ativo foi removido, selecionar outro
      if (this.activeProxy.id === proxyId && this.proxies.length > 0) {
        this.activeProxy = this.proxies[0];
      }
      
      return removed;
    }
    return null;
  }

  getRandomProxy() {
    const activeProxies = this.proxies.filter(p => p.status === 'active');
    if (activeProxies.length === 0) {
      return this.getDefaultProxy();
    }
    
    const randomIndex = Math.floor(Math.random() * activeProxies.length);
    return activeProxies[randomIndex];
  }

  getDefaultProxy() {
    return {
      id: 'default',
      host: '127.0.0.1',
      port: 1080,
      type: 'socks5',
      username: null,
      password: null,
      country: 'Local',
      status: 'active'
    };
  }

  setActiveProxy(proxyId) {
    const proxy = this.proxies.find(p => p.id === proxyId);
    if (proxy) {
      this.activeProxy = proxy;
      console.log(chalk.blue(`🔄 Proxy ativo alterado: ${proxy.host}:${proxy.port}`));
      return proxy;
    }
    return null;
  }

  async testProxy(proxy) {
    console.log(chalk.yellow(`🧪 Testando proxy: ${proxy.host}:${proxy.port}`));
    
    const startTime = Date.now();
    
    try {
      // Simulação de teste de proxy
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const responseTime = Date.now() - startTime;
      const success = Math.random() > 0.2; // 80% de chance de sucesso
      
      if (success) {
        proxy.status = 'active';
        proxy.responseTime = responseTime;
        proxy.lastTested = new Date();
        
        this.stats.successfulRequests++;
        console.log(chalk.green(`✅ Proxy OK: ${proxy.host}:${proxy.port} (${responseTime}ms)`));
        
        return {
          success: true,
          responseTime,
          ip: this.generateFakeIP(),
          country: proxy.country || 'Unknown'
        };
      } else {
        throw new Error('Conexão falhou');
      }
    } catch (error) {
      proxy.status = 'failed';
      proxy.lastTested = new Date();
      this.stats.failedRequests++;
      
      console.log(chalk.red(`❌ Proxy falhou: ${proxy.host}:${proxy.port} - ${error.message}`));
      throw error;
    } finally {
      this.stats.totalRequests++;
      this.updateAverageResponseTime();
    }
  }

  async testAllProxies() {
    console.log(chalk.blue('🔍 Testando todos os proxies...'));
    
    const results = [];
    for (const proxy of this.proxies) {
      try {
        const result = await this.testProxy(proxy);
        results.push({ proxy: proxy.id, ...result });
      } catch (error) {
        results.push({ proxy: proxy.id, success: false, error: error.message });
      }
    }
    
    console.log(chalk.blue(`✅ Teste de proxies concluído: ${results.filter(r => r.success).length}/${results.length} ativos`));
    return results;
  }

  generateFakeIP() {
    return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
  }

  updateAverageResponseTime() {
    const activeTimes = this.proxies
      .filter(p => p.responseTime !== null)
      .map(p => p.responseTime);
    
    if (activeTimes.length > 0) {
      this.stats.averageResponseTime = activeTimes.reduce((a, b) => a + b, 0) / activeTimes.length;
    }
  }

  getAllProxies() {
    return this.proxies;
  }

  getActiveProxy() {
    return this.activeProxy;
  }

  getProxyCount() {
    return {
      total: this.proxies.length,
      active: this.proxies.filter(p => p.status === 'active').length,
      failed: this.proxies.filter(p => p.status === 'failed').length
    };
  }

  getStats() {
    return this.stats;
  }

  getProxyString(proxy = this.activeProxy) {
    if (proxy.username && proxy.password) {
      return `${proxy.type}://${proxy.username}:${proxy.password}@${proxy.host}:${proxy.port}`;
    }
    return `${proxy.type}://${proxy.host}:${proxy.port}`;
  }
}

module.exports = ProxyManager;