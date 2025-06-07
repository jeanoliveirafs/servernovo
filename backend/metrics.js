const client = require('prom-client');

// Registrar métricas padrão do Node.js
client.register.clear();
client.collectDefaultMetrics();

// Métricas customizadas para o Phantom Identity System
const metrics = {
    // Counter: Número total de conexões WebSocket
    wsConnections: new client.Counter({
        name: 'phantom_websocket_connections_total',
        help: 'Total number of WebSocket connections established',
        labelNames: ['client_type']
    }),

    // Gauge: Número atual de clientes conectados
    activeClients: new client.Gauge({
        name: 'phantom_active_clients',
        help: 'Current number of active phantom clients'
    }),

    // Counter: Número de identidades geradas
    identitiesGenerated: new client.Counter({
        name: 'phantom_identities_generated_total',
        help: 'Total number of phantom identities generated'
    }),

    // Counter: Número de testes de fingerprint realizados
    fingerprintTests: new client.Counter({
        name: 'phantom_fingerprint_tests_total',
        help: 'Total number of fingerprint tests performed',
        labelNames: ['test_site', 'result']
    }),

    // Histogram: Tempo de resposta das requisições API
    httpRequestDuration: new client.Histogram({
        name: 'phantom_http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.5, 1, 2, 5, 10]
    }),

    // Counter: Número de proxies testados
    proxyTests: new client.Counter({
        name: 'phantom_proxy_tests_total',
        help: 'Total number of proxy tests performed',
        labelNames: ['proxy_type', 'result']
    }),

    // Gauge: Número de proxies ativos
    activeProxies: new client.Gauge({
        name: 'phantom_active_proxies',
        help: 'Current number of active proxies'
    }),

    // Counter: Número de ações sincronizadas
    syncActions: new client.Counter({
        name: 'phantom_sync_actions_total',
        help: 'Total number of synchronized actions',
        labelNames: ['action_type']
    }),

    // Gauge: Uso de memória do processo
    memoryUsage: new client.Gauge({
        name: 'phantom_memory_usage_bytes',
        help: 'Memory usage in bytes',
        labelNames: ['type']
    }),

    // Counter: Erros por tipo
    errors: new client.Counter({
        name: 'phantom_errors_total',
        help: 'Total number of errors by type',
        labelNames: ['error_type', 'component']
    }),

    // Histogram: Tempo de geração de fingerprints
    fingerprintGeneration: new client.Histogram({
        name: 'phantom_fingerprint_generation_duration_seconds',
        help: 'Time taken to generate fingerprints',
        buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
    }),

    // Gauge: Uptime do sistema
    uptime: new client.Gauge({
        name: 'phantom_uptime_seconds',
        help: 'System uptime in seconds'
    })
};

// Função para atualizar métricas de sistema
function updateSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    metrics.memoryUsage.set({ type: 'rss' }, memUsage.rss);
    metrics.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    metrics.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    metrics.memoryUsage.set({ type: 'external' }, memUsage.external);
    
    metrics.uptime.set(process.uptime());
}

// Middleware para capturar métricas HTTP
function httpMetricsMiddleware(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
        const duration = (Date.now() - start) / 1000;
        const route = req.route ? req.route.path : req.path;
        
        metrics.httpRequestDuration
            .labels(req.method, route, res.statusCode.toString())
            .observe(duration);
    });
    
    next();
}

// Função para registrar erro
function recordError(errorType, component) {
    metrics.errors.labels(errorType, component).inc();
}

// Função para registrar conexão WebSocket
function recordWebSocketConnection(clientType = 'unknown') {
    metrics.wsConnections.labels(clientType).inc();
}

// Função para registrar ação sincronizada
function recordSyncAction(actionType) {
    metrics.syncActions.labels(actionType).inc();
}

// Função para registrar teste de fingerprint
function recordFingerprintTest(testSite, result) {
    metrics.fingerprintTests.labels(testSite, result).inc();
}

// Função para registrar teste de proxy
function recordProxyTest(proxyType, result) {
    metrics.proxyTests.labels(proxyType, result).inc();
}

// Função para registrar geração de identidade
function recordIdentityGeneration() {
    metrics.identitiesGenerated.inc();
}

// Função para atualizar número de clientes ativos
function updateActiveClients(count) {
    metrics.activeClients.set(count);
}

// Função para atualizar número de proxies ativos
function updateActiveProxies(count) {
    metrics.activeProxies.set(count);
}

// Função para medir tempo de geração de fingerprint
function measureFingerprintGeneration(fn) {
    const start = Date.now();
    const result = fn();
    const duration = (Date.now() - start) / 1000;
    
    metrics.fingerprintGeneration.observe(duration);
    
    return result;
}

// Atualizar métricas de sistema a cada 10 segundos
setInterval(updateSystemMetrics, 10000);

// Endpoint para exposição de métricas
function getMetrics() {
    return client.register.metrics();
}

module.exports = {
    metrics,
    httpMetricsMiddleware,
    recordError,
    recordWebSocketConnection,
    recordSyncAction,
    recordFingerprintTest,
    recordProxyTest,
    recordIdentityGeneration,
    updateActiveClients,
    updateActiveProxies,
    measureFingerprintGeneration,
    getMetrics,
    register: client.register
}; 