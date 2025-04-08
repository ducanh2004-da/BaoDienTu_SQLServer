// Middleware for role-based authentication

module.exports = {
    // Check if the user is logged in
    isUser: function (req, res, next) {
        if (!req.session.user) {
            return res.redirect('/api');
        }
        req.session.isUser = true;
        next();
    },

    // Generalized role checker
    checkRole: function (role) {
        return (req, res, next) => {
            module.exports.isUser(req, res, () => {
                if (req.user.role === role) {
                    req.session.isSubscriber = true;
                    return next();
                }
                res.status(403).send('Access Denied! Wrong Role');
            });
        };
    },

    // Role-specific middleware
    isAdmin: function (req, res, next) {
        return module.exports.checkRole('admin')(req, res, next);
    },

    isEditor: function (req, res, next) {
        return module.exports.checkRole('editor')(req, res, next);
    },

    isWriter: function (req, res, next) {
        return module.exports.checkRole('writer')(req, res, next);
    },

    isSubscriber: function (req, res, next) {
        module.exports.isUser(req, res, () => {
            const allowedRoles = ['subscriber', 'admin', 'editor', 'writer'];
            if (allowedRoles.includes(req.user.role)) {
                req.session.isSubscriber = true;
            }
            return next();
        });
    }
};
