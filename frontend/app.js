// Estado global
let currentPhantomIdentity = null;
let userRealIP = null;
let userRealAgent = navigator.userAgent;

// Elementos DOM
const elements = {
    realIP: document.getElementById('real-ip'),
    phantomIP: document.getElementById('phantom-ip'),
    realLocation: document.getElementById('real-location'),
    phantomLocation: document.getElementById('phantom-location'),
    maskingStatus: document.getElementById('masking-status'),
    realUserAgent: document.getElementById('real-user-agent'),
    phantomUserAgent: document.getElementById('phantom-user-agent'),
    phantomId: document.getElementById('phantom-id'),
    displayPhantomIP: document.getElementById('display-phantom-ip'),
    displayPhantomLocation: document.getElementById('display-phantom-location'),
    phantomLanguage: document.getElementById('phantom-language'),
    phantomTimezone: document.getElementById('phantom-timezone'),
    phantomPlatform: document.getElementById('phantom-platform'),
    targetUrl: document.getElementById('target-url'),
    generatedLinks: document.getElementById('generated-links'),
    debugOutput: document.getElementById('debug-output'),
    logs: document.getElementById('logs')
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    log('🎭 Phantom Identity Dashboard iniciado', 'success');
    
    // Mostrar user agent real
    if (elements.realUserAgent) {
        elements.realUserAgent.textContent = userRealAgent;
    }
    
    // Configurar event listeners
    setupEventListeners();
    
    // Carregar dados iniciais
    loadInitialData();
});

// Event Listeners
function setupEventListeners() {
    // Gerar nova identidade
    document.getElementById('generate-identity')?.addEventListener('click', generateNewIdentity);
    
    // Testar proxy real
    document.getElementById('test-real-proxy')?.addEventListener('click', testRealProxy);
    
    // Verificar IP
    document.getElementById('check-ip')?.addEventListener('click', checkUserIP);
    
    // Gerar links
    document.getElementById('generate-links')?.addEventListener('click', generateSharedLink);
    
    // Debug
    document.getElementById('show-debug')?.addEventListener('click', showDebugInfo);
}

// Carregar dados iniciais
async function loadInitialData() {
    log('📡 Carregando dados iniciais...', 'info');
    
    try {
        // Carregar IP real do usuário
        await getUserRealIP();
        
        // Carregar identidade phantom atual
        await loadPhantomIdentity();
        
        // Comparar IPs
        updateMaskingStatus();
        
    } catch (error) {
        log(`❌ Erro ao carregar dados: ${error.message}`, 'error');
    }
}

// Obter IP real do usuário
async function getUserRealIP() {
    try {
        log('🔍 Verificando seu IP real...', 'info');
        
        // Tentar múltiplos serviços para obter IP
        const ipServices = [
            'https://api.ipify.org?format=json',
            'https://ipapi.co/json/',
            'https://ipinfo.io/json'
        ];
        
        for (const service of ipServices) {
            try {
                const response = await fetch(service);
                const data = await response.json();
                
                if (data.ip) {
                    userRealIP = data.ip;
                    if (elements.realIP) elements.realIP.textContent = userRealIP;
                    
                    // Adicionar localização se disponível
                    if (data.city || data.region || data.country) {
                        const location = `${data.city || ''} ${data.region || ''} ${data.country || ''}`.trim();
                        if (elements.realLocation) elements.realLocation.textContent = location;
                    }
                    
                    log(`✅ IP real detectado: ${userRealIP}`, 'success');
                    return;
                }
            } catch (err) {
                console.warn(`Serviço ${service} falhou:`, err);
            }
        }
        
        // Fallback - usar API local
        const localResponse = await fetch('/api/test-proxy');
        const localData = await localResponse.json();
        
        if (localData.comparison?.yourRealIP) {
            userRealIP = localData.comparison.yourRealIP;
            if (elements.realIP) elements.realIP.textContent = userRealIP;
            log(`✅ IP real detectado (local): ${userRealIP}`, 'success');
        }
        
    } catch (error) {
        log(`❌ Erro ao obter IP real: ${error.message}`, 'error');
        userRealIP = 'Não detectado';
        if (elements.realIP) elements.realIP.textContent = userRealIP;
    }
}

// Carregar identidade phantom
async function loadPhantomIdentity() {
    try {
        log('🎭 Carregando identidade phantom...', 'info');
        
        const response = await fetch('/api/identity');
        const data = await response.json();
        
        if (data.success && data.identity) {
            currentPhantomIdentity = data.identity;
            updatePhantomDisplay();
            log('✅ Identidade phantom carregada', 'success');
        } else {
            throw new Error('Erro ao carregar identidade');
        }
        
    } catch (error) {
        log(`❌ Erro ao carregar identidade: ${error.message}`, 'error');
    }
}

// Atualizar display da identidade phantom
function updatePhantomDisplay() {
    if (!currentPhantomIdentity) return;
    
    const identity = currentPhantomIdentity;
    
    // Atualizar elementos
    if (elements.phantomId) elements.phantomId.textContent = identity.id;
    if (elements.phantomIP) elements.phantomIP.textContent = identity.proxy.ip;
    if (elements.displayPhantomIP) elements.displayPhantomIP.textContent = identity.proxy.ip;
    if (elements.phantomLocation) elements.phantomLocation.textContent = identity.proxy.location;
    if (elements.displayPhantomLocation) elements.displayPhantomLocation.textContent = identity.proxy.location;
    if (elements.phantomUserAgent) elements.phantomUserAgent.textContent = identity.fingerprint.userAgent;
    if (elements.phantomLanguage) elements.phantomLanguage.textContent = identity.fingerprint.language;
    if (elements.phantomTimezone) elements.phantomTimezone.textContent = identity.fingerprint.timezone;
    if (elements.phantomPlatform) elements.phantomPlatform.textContent = identity.fingerprint.platform;
}

// Atualizar status do mascaramento
function updateMaskingStatus() {
    if (!userRealIP || !currentPhantomIdentity) return;
    
    const isActive = userRealIP !== currentPhantomIdentity.proxy.ip;
    const statusEl = elements.maskingStatus;
    
    if (statusEl) {
        statusEl.className = `status-indicator ${isActive ? 'active' : 'inactive'}`;
        statusEl.innerHTML = `
            <span class="status-text">
                ${isActive ? '✅ MASCARAMENTO ATIVO' : '⚠️ IPs IGUAIS - VERIFICAR'} 
                <br>
                <small>${userRealIP} ${isActive ? '≠' : '='} ${currentPhantomIdentity.proxy.ip}</small>
            </span>
        `;
    }
    
    log(`🔍 Comparação de IPs: Real(${userRealIP}) vs Phantom(${currentPhantomIdentity.proxy.ip}) = ${isActive ? 'DIFERENTES ✅' : 'IGUAIS ⚠️'}`, isActive ? 'success' : 'warning');
}

// Gerar nova identidade
async function generateNewIdentity() {
    try {
        log('🔄 Gerando nova identidade brasileira...', 'info');
        
        const response = await fetch('/api/identity');
        const data = await response.json();
        
        if (data.success) {
            currentPhantomIdentity = data.identity;
            updatePhantomDisplay();
            updateMaskingStatus();
            log('✅ Nova identidade gerada com sucesso!', 'success');
        } else {
            throw new Error(data.message || 'Erro desconhecido');
        }
        
    } catch (error) {
        log(`❌ Erro ao gerar identidade: ${error.message}`, 'error');
    }
}

// Testar proxy real
async function testRealProxy() {
    try {
        log('🧪 Testando proxy real...', 'info');
        
        const response = await fetch('/api/test-proxy');
        const data = await response.json();
        
        if (data.success) {
            const comparison = data.comparison;
            
            log(`🔍 Teste de Proxy:`, 'info');
            log(`   • Seu IP Real: ${comparison.yourRealIP}`, 'info');
            log(`   • IP Phantom: ${comparison.phantomIP}`, 'info');
            log(`   • Status: ${comparison.masking}`, comparison.masking === 'ATIVO' ? 'success' : 'warning');
            log(`   • Localização: ${comparison.location}`, 'info');
            
            // Atualizar display se necessário
            if (!userRealIP && comparison.yourRealIP) {
                userRealIP = comparison.yourRealIP;
                if (elements.realIP) elements.realIP.textContent = userRealIP;
                updateMaskingStatus();
            }
            
        } else {
            throw new Error(data.message || 'Erro no teste');
        }
        
    } catch (error) {
        log(`❌ Erro no teste de proxy: ${error.message}`, 'error');
    }
}

// Verificar IP do usuário
async function checkUserIP() {
    log('🔍 Verificando seu IP...', 'info');
    await getUserRealIP();
    updateMaskingStatus();
}

// Gerar link compartilhado
async function generateSharedLink() {
    try {
        const targetUrl = elements.targetUrl?.value || 'https://httpbin.org/headers';
        
        log(`🔗 Gerando link compartilhado para: ${targetUrl}`, 'info');
        
        const response = await fetch('/api/generate-links', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUrl })
        });
        
        const data = await response.json();
        
        if (data.success) {
            displayGeneratedLink(data.link, data.createdByIP);
            log(`✅ Link gerado: ${data.link.url}`, 'success');
        } else {
            throw new Error(data.message || 'Erro ao gerar link');
        }
        
    } catch (error) {
        log(`❌ Erro ao gerar link: ${error.message}`, 'error');
    }
}

// Exibir link gerado
function displayGeneratedLink(linkData, createdByIP) {
    if (!elements.generatedLinks) return;
    
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';
    linkItem.innerHTML = `
        <h3>🔗 Link Compartilhado Gerado</h3>
        <div class="link-url">
            <span>${linkData.url}</span>
            <button onclick="copyToClipboard('${linkData.url}')" class="btn btn-info" style="margin-left: 1rem; padding: 0.4rem 0.8rem;">
                📋 Copiar
            </button>
            <button onclick="window.open('${linkData.url}', '_blank')" class="btn btn-secondary" style="margin-left: 0.5rem; padding: 0.4rem 0.8rem;">
                🚀 Testar
            </button>
        </div>
        <div class="link-meta">
            <div><strong>ID:</strong> ${linkData.id}</div>
            <div><strong>IP Phantom:</strong> ${linkData.phantomIP}</div>
            <div><strong>Localização:</strong> ${linkData.location}</div>
            <div><strong>Criado por IP:</strong> ${createdByIP}</div>
            <div><strong>Expira em:</strong> ${new Date(linkData.expiresAt).toLocaleString('pt-BR')}</div>
            <div><strong>Destino:</strong> ${linkData.targetUrl}</div>
        </div>
    `;
    
    elements.generatedLinks.insertBefore(linkItem, elements.generatedLinks.firstChild);
}

// Copiar para clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        log(`📋 Link copiado: ${text}`, 'success');
    }).catch(err => {
        log(`❌ Erro ao copiar: ${err.message}`, 'error');
    });
}

// Mostrar informações de debug
async function showDebugInfo() {
    try {
        log('📊 Carregando informações de debug...', 'info');
        
        const response = await fetch('/api/debug');
        const data = await response.json();
        
        if (elements.debugOutput) {
            elements.debugOutput.innerHTML = `
                <h4>🔍 Debug - Status dos Links</h4>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            `;
        }
        
        log('✅ Debug carregado', 'success');
        
    } catch (error) {
        log(`❌ Erro ao carregar debug: ${error.message}`, 'error');
    }
}

// Sistema de logs
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR');
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.innerHTML = `[${timestamp}] ${message}`;
    
    if (elements.logs) {
        elements.logs.insertBefore(logEntry, elements.logs.firstChild);
        
        // Manter apenas os últimos 50 logs
        while (elements.logs.children.length > 50) {
            elements.logs.removeChild(elements.logs.lastChild);
        }
    }
    
    // Também logar no console
    console.log(`[${timestamp}] ${message}`);
}