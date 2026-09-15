const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    if (err.code === 11000) {
        return res.status(400).json({
            success: false,
            message: 'This email is already registered'
        });
    }

    const status = err.status && err.status >= 400 && err.status < 500 ? err.status : 500;
    return res.status(status).json({
        success: false,
        message: status === 500 ? 'Internal server error' : (err.publicMessage || err.message || 'Request failed')
    });
};

module.exports = errorHandler;