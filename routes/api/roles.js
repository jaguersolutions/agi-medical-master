const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const { check, validationResult } = require('express-validator');
const logAction = require('../../utils/auditLogger');
const User = require('../../models/User');

const Role = require('../../models/Role');

// @route   GET api/roles
// @desc    Get all roles
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const roles = await Role.find();
        res.json(roles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/roles
// @desc    Create a new role
// @access  Private (agi_admin)
router.post(
    '/',
    [
        auth,
        authorize('manage_roles'), // This permission will need to be added to the agi_admin role
        [
            check('name', 'Name is required').not().isEmpty(),
            check('permissions', 'Permissions must be an array').isArray()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, permissions } = req.body;

        try {
            let role = await Role.findOne({ name });
            if (role) {
                return res.status(400).json({ errors: [{ msg: 'Role already exists' }] });
            }

            role = new Role({
                name,
                description,
                permissions
            });

            await role.save();

            const adminUser = await User.findById(req.user.id);
            await logAction({
                user: req.user.id,
                organization: adminUser.organization,
                action: 'create_role',
                targetType: 'Role',
                targetId: role.id,
                details: { name: role.name }
            });

            res.json(role);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   PUT api/roles/:id
// @desc    Update a role
// @access  Private (agi_admin)
router.put(
    '/:id',
    [
        auth,
        authorize('manage_roles'),
        [
            check('name', 'Name is required').not().isEmpty(),
            check('permissions', 'Permissions must be an array').isArray()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, permissions } = req.body;

        const roleFields = { name, description, permissions };

        try {
            let role = await Role.findById(req.params.id);
            if (!role) {
                return res.status(404).json({ msg: 'Role not found' });
            }

            const originalRole = await Role.findById(req.params.id);

            role = await Role.findByIdAndUpdate(
                req.params.id,
                { $set: roleFields },
                { new: true }
            );

            const adminUser = await User.findById(req.user.id);
            await logAction({
                user: req.user.id,
                organization: adminUser.organization,
                action: 'update_role',
                targetType: 'Role',
                targetId: role.id,
                details: {
                    name: role.name,
                    previous_name: originalRole.name // Example of logging a change
                }
            });

            res.json(role);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
