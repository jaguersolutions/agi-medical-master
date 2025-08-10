const authorize = (...requiredPermissions) => {
    return (req, res, next) => {
        const { permissions } = req.user;

        if (!permissions) {
            return res.status(403).json({ msg: 'Forbidden: No permissions found for user.' });
        }

        const hasPermission = requiredPermissions.some(p => permissions.includes(p));

        if (!hasPermission) {
            return res.status(403).json({ msg: `Forbidden: Requires one of the following permissions: ${requiredPermissions.join(', ')}` });
        }

        next();
    };
};

module.exports = authorize;
