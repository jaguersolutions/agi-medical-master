const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Equipment = require('../../models/Equipment');
const User = require('../../models/User');

// @route   POST api/equipment
// @desc    Enroll a new piece of equipment
// @access  Private
router.post(
    '/',
    [
        auth,
        [
            check('licenseKey', 'License key is required').not().isEmpty(),
            check('moduleType', 'Module type ID is required').isMongoId()
        ]
    ],
    async (req, res) => {
        // Check for permissions
        if (!req.user.permissions.includes('enroll_equipment')) {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to enroll equipment.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { licenseKey, moduleType } = req.body;

        try {
            // Get user's organization
            const user = await User.findById(req.user.id);
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }

            // Check if license key already exists
            let equipment = await Equipment.findOne({ licenseKey });
            if (equipment) {
                return res.status(400).json({ errors: [{ msg: 'Equipment with this license key already exists' }] });
            }

            equipment = new Equipment({
                organization: user.organization,
                moduleType,
                licenseKey
            });

            await equipment.save();
            res.json(equipment);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/equipment
// @desc    Get all equipment for an organization
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const equipment = await Equipment.find({ organization: user.organization }).populate('moduleType', ['name']);
        res.json(equipment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/equipment/status/:id
// @desc    Update the status of a piece of equipment
// @access  Private
router.patch(
    '/status/:id',
    [
        auth,
        check('status', 'Status is required and must be "online" or "offline"').isIn(['online', 'offline'])
    ],
    async (req, res) => {
        if (!req.user.permissions.includes('manage_equipment_status')) {
            return res.status(403).json({ msg: 'Forbidden: You do not have permission to update equipment status.' });
        }

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const equipment = await Equipment.findById(req.params.id);

            if (!equipment) {
                return res.status(404).json({ msg: 'Equipment not found' });
            }

            // Ensure the user belongs to the same organization as the equipment
            const user = await User.findById(req.user.id);
            if (equipment.organization.toString() !== user.organization.toString()) {
                return res.status(403).json({ msg: 'User not authorized to update this equipment' });
            }

            equipment.status = req.body.status;
            equipment.lastSeen = Date.now();

            await equipment.save();
            res.json(equipment);

        } catch (err) {
            console.error(err.message);
            if (err.kind === 'ObjectId') {
                return res.status(404).json({ msg: 'Equipment not found' });
            }
            res.status(500).send('Server Error');
        }
    }
);

module.exports = router;
