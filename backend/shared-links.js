const { v4: uuidv4 } = require('uuid');
const chalk = require('chalk');

class SharedLinksManager {
    constructor() {
        this.activeLinks = new Map();
        this.linkStats = new Map();
        this.cleanupInterval = null;
        
        // Iniciar limpeza automática de links expirados
        this.startCleanupTimer();
    }

    /**
     * Gerar novo link compartilhado
     */
    generateSharedLink(targetUrl, options = {}) {
        const linkId = uuidv4();
        const shortId = linkId.substring(0, 8);
        
        const {
            expiresIn = '24h',
            allowMobile = true,
            maxUses = null,
            description = ''
        } = options;

        // Calcular timestamp de expiração
        const expirationTime = this.calculateExpiration(expiresIn);
        
        // Gerar identidade phantom específica para este link
        const sharedIdentity = this.generateSharedIdentity();
        
        const linkData = {
            id: linkId,
            shortId: shortId,
            targetUrl: targetUrl,
            sharedIdentity: sharedIdentity,
            createdAt: new Date(),
            expiresAt: expirationTime,
            allowMobile: allowMobile,
            maxUses: maxUses,
            currentUses: 0,
            description: description,
            isActive: true,
            metadata: {
                creatorIP: null, // Será definido no momento da criação
                userAgent: null,
                referrer: null
            }
        };

        // Armazenar link
        this.activeLinks.set(linkId, linkData);
        
        // Inicializar estatísticas
        this.linkStats.set(linkId, {
            totalAccesses: 0,
            uniqueIPs: new Set(),
            accessLog: [],
            countries: new Map(),
            devices: new Map(),
            referrers: new Map()
        });

        console.log(chalk.green(`🔗 Link compartilhado criado: ${shortId} -> ${targetUrl}`));
        
        return {
            linkId: linkId,
            shortId: shortId,
            fullUrl: `/shared/${shortId}`,
            targetUrl: targetUrl,
            sharedIP: sharedIdentity.proxy.ip,
            expiresAt: expirationTime,
            identity: sharedIdentity
        };
    }

    /**
     * Validar e obter dados do link
     */
    validateLink(linkId) {
        const link = this.activeLinks.get(linkId);
        
        if (!link) {
            return { valid: false, error: 'Link não encontrado' };
        }

        if (!link.isActive) {
            return { valid: false, error: 'Link desativado' };
        }

        if (link.expiresAt && new Date() > link.expiresAt) {
            this.deactivateLink(linkId);
            return { valid: false, error: 'Link expirado' };
        }

        if (link.maxUses && link.currentUses >= link.maxUses) {
            this.deactivateLink(linkId);
            return { valid: false, error: 'Limite de usos atingido' };
        }

        return { valid: true, link: link };
    }

    /**
     * Registrar acesso ao link
     */
    recordAccess(linkId, accessData) {
        const validation = this.validateLink(linkId);
        
        if (!validation.valid) {
            return validation;
        }

        const link = validation.link;
        const stats = this.linkStats.get(linkId);

        // Incrementar contador de usos
        link.currentUses++;

        // Registrar estatísticas
        stats.totalAccesses++;
        stats.uniqueIPs.add(accessData.ip);
        
        // Log de acesso
        const accessEntry = {
            timestamp: new Date(),
            ip: accessData.ip,
            userAgent: accessData.userAgent,
            referrer: accessData.referrer,
            country: accessData.country || 'Unknown',
            device: this.detectDevice(accessData.userAgent)
        };
        
        stats.accessLog.push(accessEntry);
        
        // Contadores por categoria
        const country = accessEntry.country;
        stats.countries.set(country, (stats.countries.get(country) || 0) + 1);
        
        const device = accessEntry.device;
        stats.devices.set(device, (stats.devices.get(device) || 0) + 1);
        
        if (accessData.referrer) {
            const referrer = new URL(accessData.referrer).hostname;
            stats.referrers.set(referrer, (stats.referrers.get(referrer) || 0) + 1);
        }

        // Limitar log de acesso (últimos 1000)
        if (stats.accessLog.length > 1000) {
            stats.accessLog = stats.accessLog.slice(-1000);
        }

        console.log(chalk.cyan(`🔗 Acesso registrado: ${link.shortId} - ${accessData.ip} (${accessEntry.device})`));

        return {
            valid: true,
            link: link,
            identity: link.sharedIdentity,
            accessEntry: accessEntry
        };
    }

    /**
     * Gerar identidade compartilhada
     */
    generateSharedIdentity() {
        return {
            id: `shared-${uuidv4().substring(0, 8)}`,
            proxy: {
                ip: this.generateRandomIP(),
                location: this.generateRandomLocation(),
                isp: this.generateRandomISP()
            },
            fingerprint: {
                userAgent: this.generateRandomUserAgent(),
                platform: 'Win32',
                language: 'pt-BR',
                timezone: 'America/Sao_Paulo',
                screen: {
                    width: 1920,
                    height: 1080,
                    colorDepth: 24
                }
            },
            createdAt: new Date()
        };
    }

    /**
     * Obter link por shortId
     */
    getLinkByShortId(shortId) {
        for (const [linkId, link] of this.activeLinks) {
            if (link.shortId === shortId) {
                return { linkId, ...link };
            }
        }
        return null;
    }

    /**
     * Listar links ativos
     */
    getActiveLinks() {
        const activeLinks = [];
        
        for (const [linkId, link] of this.activeLinks) {
            if (link.isActive && (!link.expiresAt || new Date() < link.expiresAt)) {
                const stats = this.linkStats.get(linkId);
                activeLinks.push({
                    id: linkId,
                    shortId: link.shortId,
                    targetUrl: link.targetUrl,
                    createdAt: link.createdAt,
                    expiresAt: link.expiresAt,
                    currentUses: link.currentUses,
                    maxUses: link.maxUses,
                    sharedIP: link.sharedIdentity.proxy.ip,
                    totalAccesses: stats.totalAccesses,
                    uniqueVisitors: stats.uniqueIPs.size
                });
            }
        }
        
        return activeLinks.sort((a, b) => b.createdAt - a.createdAt);
    }

    /**
     * Obter estatísticas do link
     */
    getLinkStats(linkId) {
        const link = this.activeLinks.get(linkId);
        const stats = this.linkStats.get(linkId);
        
        if (!link || !stats) {
            return null;
        }

        return {
            linkInfo: {
                id: linkId,
                shortId: link.shortId,
                targetUrl: link.targetUrl,
                createdAt: link.createdAt,
                expiresAt: link.expiresAt,
                isActive: link.isActive
            },
            usage: {
                totalAccesses: stats.totalAccesses,
                uniqueVisitors: stats.uniqueIPs.size,
                currentUses: link.currentUses,
                maxUses: link.maxUses
            },
            demographics: {
                countries: Object.fromEntries(stats.countries),
                devices: Object.fromEntries(stats.devices),
                referrers: Object.fromEntries(stats.referrers)
            },
            recentAccesses: stats.accessLog.slice(-10)
        };
    }

    /**
     * Desativar link
     */
    deactivateLink(linkId) {
        const link = this.activeLinks.get(linkId);
        if (link) {
            link.isActive = false;
            console.log(chalk.yellow(`🔗 Link desativado: ${link.shortId}`));
            return true;
        }
        return false;
    }

    /**
     * Calcular tempo de expiração
     */
    calculateExpiration(expiresIn) {
        const now = new Date();
        const timeUnits = {
            '1h': 60 * 60 * 1000,
            '6h': 6 * 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        const duration = timeUnits[expiresIn] || timeUnits['24h'];
        return new Date(now.getTime() + duration);
    }

    /**
     * Detectar tipo de dispositivo
     */
    detectDevice(userAgent) {
        if (!userAgent) return 'Unknown';
        
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
            return 'Mobile';
        } else if (/Tablet/.test(userAgent)) {
            return 'Tablet';
        } else {
            return 'Desktop';
        }
    }

    /**
     * Limpeza automática
     */
    startCleanupTimer() {
        this.cleanupInterval = setInterval(() => {
            const now = new Date();
            for (const [linkId, link] of this.activeLinks) {
                if (link.expiresAt && now > link.expiresAt) {
                    this.activeLinks.delete(linkId);
                    this.linkStats.delete(linkId);
                }
            }
        }, 30 * 60 * 1000); // 30 minutos
    }

    /**
     * Gerar IP aleatório
     */
    generateRandomIP() {
        return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }

    /**
     * Gerar localização aleatória
     */
    generateRandomLocation() {
        const locations = [
            'São Paulo, BR', 'Rio de Janeiro, BR', 'New York, US', 
            'London, UK', 'Paris, FR', 'Tokyo, JP', 'Berlin, DE'
        ];
        return locations[Math.floor(Math.random() * locations.length)];
    }

    /**
     * Gerar ISP aleatório
     */
    generateRandomISP() {
        const isps = [
            'Vivo Fibra', 'Claro', 'Tim', 'Oi', 'NET Virtua', 
            'Google Fiber', 'Comcast', 'Verizon'
        ];
        return isps[Math.floor(Math.random() * isps.length)];
    }

    /**
     * Gerar User Agent aleatório
     */
    generateRandomUserAgent() {
        const userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0'
        ];
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    /**
     * Obter estatísticas gerais
     */
    getGeneralStats() {
        const totalLinks = this.activeLinks.size;
        const activeLinks = Array.from(this.activeLinks.values()).filter(link => 
            link.isActive && (!link.expiresAt || new Date() < link.expiresAt)
        ).length;
        
        let totalAccesses = 0;
        let totalUniqueVisitors = 0;
        
        for (const stats of this.linkStats.values()) {
            totalAccesses += stats.totalAccesses;
            totalUniqueVisitors += stats.uniqueIPs.size;
        }

        return {
            totalLinks,
            activeLinks,
            expiredLinks: totalLinks - activeLinks,
            totalAccesses,
            totalUniqueVisitors
        };
    }

    /**
     * Destruir manager
     */
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        this.activeLinks.clear();
        this.linkStats.clear();
    }
}

module.exports = SharedLinksManager; 