const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }

        if (!roles.includes(req.user.userType)) {
            return res.status(403).json({
                message: `Access denied. This action requires one of the following roles: ${roles.join(', ')}`
            });
        }

        next();
    };
};

module.exports = requireRole;