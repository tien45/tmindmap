const jwt = require('jsonwebtoken');
const admin = require('./config/firebaseAdmin');

module.exports = async function authMiddleware(req, res, next) {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        return res.status(401).json({ message: 'Thiếu header Authorization' });
    }
    const parts = authHeader.split(' ');
    if (parts[0] !== 'Bearer' || !parts[1]) {
        return res.status(401).json({ message: 'Header Authorization không hợp lệ' });
    }
    const token = parts[1];

    // 1) Decode an toàn
    let decoded;
    try {
        decoded = jwt.decode(token, { complete: true });
        if (!decoded || !decoded.header) {
            throw new Error('Invalid token format');
        }
    } catch {
        return res.status(401).json({ message: 'Token không hợp lệ' });
    }

    const alg = decoded.header.alg;
    try {
        if (alg === 'HS256') {
            // Local JWT
            const payload = jwt.verify(token, process.env.JWT_SECRET);
            if (!payload.userId) {
                return res.status(401).json({ message: 'Payload thiếu userId' });
            }
            req.user = {
                provider: 'local',
                id: payload.userId
            };
        }
        else if (alg === 'RS256') {
            // Firebase ID token
            const fb = await admin.auth().verifyIdToken(token);
            if (!fb.uid) {
                return res.status(401).json({ message: 'Firebase token thiếu uid' });
            }
            req.user = {
                provider: 'firebase',
                id: fb.uid,
                uid: fb.uid
            };
        }
        else {
            return res.status(401).json({ message: 'Unsupported token algorithm' });
        }
        next();
    } catch (err) {
        console.error('Auth verify failed:', err);
        const msg = err.name === 'TokenExpiredError'
            ? 'Token đã hết hạn'
            : 'Unauthorized: ' + err.message;
        return res.status(401).json({ message: msg });
    }
};
