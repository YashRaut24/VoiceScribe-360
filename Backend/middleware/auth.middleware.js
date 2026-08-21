const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
}

const auth = (req, res, next) => {
    try {
        const authorization = req.header('Authorization');
        const token = authorization?.startsWith('Bearer ')
            ? authorization.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;