const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Equipment = require('../../models/Equipment');
const User = require('../../models/User');
const config = require('config');

// Middleware for discovery agent authentication
const discoveryAuth = (req, res, next) => {
    const apiKey = req.header('x-discovery-key');
    if (!apiKey) {
        return res.status(401).json({ msg: 'No discovery key, authorization denied' });
    }

    if (apiKey !== config.get('discoveryApiKey')) {
        return res.status(403).json({ msg: 'Invalid discovery key' });
    }

    next();
};

// @route   POST api/equipment/discover
// @desc    Called by a discovery agent to report a new device
// @access  Private (Discovery Key)
router.post(
    '/discover',
    [
        discoveryAuth,
        [
            check('licenseKey', 'licenseKey is required').not().isEmpty(),
            check('organization', 'Organization ID is required').isMongoId(),
            check('moduleType', 'Module Type ID is required').isMongoId()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { licenseKey, organization, moduleType, name } = req.body;

        try {
            let equipment = await Equipment.findOne({ licenseKey });
            if (equipment) {
                return res.status(400).json({ errors: [{ msg: 'Equipment with this license key already registered' }] });
            }

            const equipmentFields = {
                organization,
                moduleType,
                licenseKey,
                status: 'pending_approval'
            };
            if (name) equipmentFields.name = name;

            equipment = new Equipment(equipmentFields);

            await equipment.save();
            res.json(equipment);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


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

        const { licenseKey, moduleType, name } = req.body;

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

            const equipmentFields = {
                organization: user.organization,
                moduleType,
                licenseKey
            };
            if (name) equipmentFields.name = name;

            equipment = new Equipment(equipmentFields);

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

// @route   PUT api/equipment/:id
// @desc    Update equipment details
// @access  Private
router.put('/:id', auth, async (req, res) => {
    // For now, let's assume a general permission. This could be more granular.
    if (!req.user.permissions.includes('enroll_equipment')) {
        return res.status(403).json({ msg: 'Forbidden: You do not have permission to update equipment.' });
    }

    const { name, moduleType, licenseKey } = req.body;

    // Build equipment object
    const equipmentFields = {};
    if (name) equipmentFields.name = name;
    if (moduleType) equipmentFields.moduleType = moduleType;
    if (licenseKey) equipmentFields.licenseKey = licenseKey;

    try {
        let equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }

        // Ensure the user belongs to the same organization as the equipment
        const user = await User.findById(req.user.id);
        if (equipment.organization.toString() !== user.organization.toString()) {
            return res.status(403).json({ msg: 'User not authorized to update this equipment' });
        }

        // If licenseKey is being changed, ensure it's not already taken by another device
        if (licenseKey && licenseKey !== equipment.licenseKey) {
            const existing = await Equipment.findOne({ licenseKey });
            if (existing) {
                return res.status(400).json({ errors: [{ msg: 'License key is already in use by another device' }] });
            }
        }

        equipment = await Equipment.findByIdAndUpdate(
            req.params.id,
            { $set: equipmentFields },
            { new: true }
        );

        res.json(equipment);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Equipment not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   PATCH api/equipment/:id/approve
// @desc    Approve a newly discovered piece of equipment
// @access  Private
router.patch('/:id/approve', auth, async (req, res) => {
    // This permission should be given to hospital_admin or technician roles
    if (!req.user.permissions.includes('enroll_equipment')) { // Reusing permission for now
        return res.status(403).json({ msg: 'Forbidden: You do not have permission to approve equipment.' });
    }

    const { licenseKey, name } = req.body;

    try {
        let equipment = await Equipment.findById(req.params.id);

        if (!equipment) {
            return res.status(404).json({ msg: 'Equipment not found' });
        }

        // Ensure the user belongs to the same organization as the equipment
        const user = await User.findById(req.user.id);
        if (equipment.organization.toString() !== user.organization.toString()) {
            return res.status(403).json({ msg: 'User not authorized to approve this equipment' });
        }

        if (equipment.status !== 'pending_approval') {
            return res.status(400).json({ msg: 'Equipment is not pending approval' });
        }

        // Update fields
        if (name) equipment.name = name;
        if (licenseKey) {
             // If licenseKey is being changed, ensure it's not already taken
            if (licenseKey !== equipment.licenseKey) {
                const existing = await Equipment.findOne({ licenseKey });
                if (existing) {
                    return res.status(400).json({ errors: [{ msg: 'License key is already in use by another device' }] });
                }
                equipment.licenseKey = licenseKey;
            }
        }

        equipment.status = 'offline'; // Set to offline, ready for use
        equipment.enrolledAt = Date.now(); // Mark the formal enrollment time

        await equipment.save();

        res.json(equipment);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Equipment not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
