const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../../models/User');
const Role = require('../../models/Role'); // Assuming Role model is needed for default role

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        check('name', 'Name is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, organizationId } = req.body;

        try {
            // See if user exists
            let user = await User.findOne({ email });
            if (user) {
                return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
            }

            // For simplicity, let's assign a default role, e.g., 'hospital_user'
            // In a real app, this might be more complex, perhaps based on an invite or org settings.
            // Note: The seeder script must have been run for this to work.
            const defaultRole = await Role.findOne({ name: 'hospital_user' });
            if (!defaultRole) {
                 // Fallback or error if default role not found
                const readOnlyRole = await Role.findOne({ name: 'read_only' });
                if(!readOnlyRole) {
                    return res.status(500).send('Default role not found. Please run database seeder.');
                }
            }

            // In a real scenario, organizationId would be required and validated.
            // For now, this is a placeholder. A real implementation would check if the organization exists.
            if (!organizationId) {
                return res.status(400).json({ errors: [{ msg: 'Organization ID is required' }] });
            }

            user = new User({
                name,
                email,
                password,
                organization: organizationId,
                role: defaultRole ? defaultRole._id : readOnlyRole._id
            });

            await user.save();

            // Return jsonwebtoken
            const payload = {
                user: {
                    id: user.id,
                    role: defaultRole ? defaultRole.name : readOnlyRole.name,
                    permissions: defaultRole ? defaultRole.permissions : readOnlyRole.permissions
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: config.get('jwtExpiration') },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email }).populate('role');
            if (!user) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const isMatch = await user.comparePassword(password);
            if (!isMatch) {
                return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
            }

            const payload = {
                user: {
                    id: user.id,
                    role: user.role.name,
                    permissions: user.role.permissions
                }
            };

            jwt.sign(
                payload,
                config.get('jwtSecret'),
                { expiresIn: config.get('jwtExpiration') },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
