const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const { check, validationResult } = require('express-validator');
const logAction = require('../../utils/auditLogger');

const User = require('../../models/User');
const Role = require('../../models/Role');

// @route   GET api/users
// @desc    Get all users for the current user's organization
// @access  Private (hospital_admin)
router.get('/', auth, async (req, res) => {
    try {
        // Get the current user to find their organization
        const currentUser = await User.findById(req.user.id);
        if (!currentUser) {
            return res.status(404).json({ msg: 'Current user not found' });
        }

        const users = await User.find({ organization: currentUser.organization }).select('-password').populate('role', ['name']);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/users/:id/role
// @desc    Update a user's role
// @access  Private (hospital_admin)
router.put(
    '/:id/role',
    [
        auth,
        authorize('manage_users'),
        check('roleId', 'Role ID is required').isMongoId()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { roleId } = req.body;
        const userIdToUpdate = req.params.id;

        try {
            // Get the current user (the admin making the request)
            const adminUser = await User.findById(req.user.id);

            // Find the user to be updated
            let userToUpdate = await User.findById(userIdToUpdate);
            if (!userToUpdate) {
                return res.status(404).json({ msg: 'User to update not found' });
            }

            // Security check: Ensure the admin is updating a user within their own organization
            if (userToUpdate.organization.toString() !== adminUser.organization.toString()) {
                return res.status(403).json({ msg: 'Forbidden: You can only update users in your own organization.' });
            }

            // Security check: Prevent a hospital_admin from changing their own role
            if (adminUser.id === userToUpdate.id) {
                return res.status(403).json({ msg: 'Forbidden: You cannot change your own role.' });
            }

            // Check if the target role exists
            const newRole = await Role.findById(roleId);
            if (!newRole) {
                return res.status(404).json({ msg: 'Target role not found' });
            }

            // Security check: Prevent hospital_admin from assigning agi_admin role
            if (newRole.name === 'agi_admin') {
                return res.status(403).json({ msg: 'Forbidden: Cannot assign AGI admin role.' });
            }

            const oldRoleId = userToUpdate.role;
            userToUpdate.role = roleId;
            await userToUpdate.save();

            await logAction({
                user: req.user.id,
                organization: adminUser.organization,
                action: 'update_user_role',
                targetType: 'User',
                targetId: userToUpdate.id,
                details: {
                    updatedUserId: userToUpdate.id,
                    previousRoleId: oldRoleId,
                    newRoleId: roleId
                }
            });

            res.json(await User.findById(userIdToUpdate).select('-password').populate('role', ['name']));

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


module.exports = router;
