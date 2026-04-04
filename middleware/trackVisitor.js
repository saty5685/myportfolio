const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const VISITORS_FILE = path.join(__dirname, '..', 'data', 'visitors.json');

function getVisitors() {
    try {
        const data = fs.readFileSync(VISITORS_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return [];
    }
}

function saveVisitors(visitors) {
    fs.writeFileSync(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8');
}

function hashIP(ip) {
    return crypto.createHash('sha256').update(ip).digest('hex').slice(0, 16);
}

function trackVisitor(req, res, next) {
    // Skip static files and admin/API routes
    if (
        req.path.startsWith('/css') ||
        req.path.startsWith('/js') ||
        req.path.startsWith('/images') ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/utility') ||
        req.path.startsWith('/docs') ||
        req.path.startsWith('/admin/api/visitors') ||
        req.path.endsWith('.ico')
    ) {
        return next();
    }

    try {
        const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
        const visitorId = hashIP(ip);
        const userAgent = req.headers['user-agent'] || 'unknown';
        const page = req.originalUrl || req.path;
        const now = new Date().toISOString();

        const visitors = getVisitors();
        const existing = visitors.find(v => v.visitorId === visitorId);

        if (existing) {
            existing.visitCount += 1;
            existing.lastVisit = now;
            existing.userAgent = userAgent;
            if (!existing.pagesVisited.includes(page)) {
                existing.pagesVisited.push(page);
            }
            // Track per-page hit counts
            existing.pageHits = existing.pageHits || {};
            existing.pageHits[page] = (existing.pageHits[page] || 0) + 1;
        } else {
            visitors.push({
                visitorId,
                ip: ip.replace(/^::ffff:/, ''),
                userAgent,
                visitCount: 1,
                firstVisit: now,
                lastVisit: now,
                pagesVisited: [page],
                pageHits: { [page]: 1 }
            });
        }

        saveVisitors(visitors);
    } catch (err) {
        console.error('Visitor tracking error:', err.message);
    }

    next();
}

module.exports = trackVisitor;
