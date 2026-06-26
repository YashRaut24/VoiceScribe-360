const { AuditLog } = require('../models');

const audit = (action, resourceType = null) => {
    return async (req, res, next) => {
        const originalJson = res.json.bind(res);

        res.json = async function (data) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const userId = req.user?.userId || data?.user?.id;
                    const userType = req.user?.userType || data?.user?.userType;

                    const logEntry = {
                        userId,
                        userType,
                        action,
                        ipAddress: req.ip,
                        userAgent: req.get('User-Agent'),
                        resourceType
                    };

                    if (data?._id) {
                        logEntry.resourceId = data._id;
                    }

                    if (userId && userType) {
                        await AuditLog.create(logEntry);
                    }
                } catch (auditError) {
                    console.error('Audit log failed:', auditError.message);
                }
            }

            return originalJson(data);
        };

        next();
    };
};

module.exports = audit;