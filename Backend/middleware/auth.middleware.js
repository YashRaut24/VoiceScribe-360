const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'ab5ab79849f4661000f7a25fe309867ef50d70523007ff09f2bf297ab1006aadcbd38c32c0152f932ac96a701ad361f3cda51cc0520238983209086e9cb0766a';

const auth = (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

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