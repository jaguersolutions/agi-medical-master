const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const { check, validationResult } = require('express-validator');

const Organization = require('../../models/Organization');

// @route   POST api/organizations
// @desc    Create a new organization
// @access  Private (agi_admin)
router.post(
    '/',
    [
        auth,
        authorize('manage_organizations'),
        [
            check('name', 'Name is required').not().isEmpty(),
            check('address', 'Address is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, address, locations, branding } = req.body;

        try {
            let organization = await Organization.findOne({ name });
            if (organization) {
                return res.status(400).json({ errors: [{ msg: 'Organization already exists' }] });
            }

            const orgFields = { name, address };
            if (locations) orgFields.locations = locations;
            if (branding) orgFields.branding = branding;

            organization = new Organization(orgFields);

            await organization.save();
            res.json(organization);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/organizations
// @desc    Get all organizations
// @access  Private (agi_admin)
router.get('/', [auth, authorize('manage_organizations')], async (req, res) => {
    try {
        const organizations = await Organization.find().sort({ createdAt: -1 });
        res.json(organizations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

const User = require('../../models/User');

// @route   GET api/organizations/my/branding
// @desc    Get branding for the current user's organization
// @access  Private
router.get('/my/branding', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate({
            path: 'organization',
            select: 'branding'
        });

        if (!user || !user.organization) {
            return res.status(404).json({ msg: 'Organization not found for this user' });
        }

        res.json(user.organization.branding || {});
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/organizations/:id
// @desc    Get organization by ID
// @access  Private (agi_admin)
router.get('/:id', [auth, authorize('manage_organizations')], async (req, res) => {
    try {
        const organization = await Organization.findById(req.params.id).populate('users', ['name', 'email']);
        if (!organization) {
            return res.status(404).json({ msg: 'Organization not found' });
        }
        res.json(organization);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   PUT api/organizations/:id
// @desc    Update an organization
// @access  Private (agi_admin)
router.put('/:id', [auth, authorize('manage_organizations')], async (req, res) => {
    const { name, address, locations, branding } = req.body;

    const orgFields = {};
    if (name) orgFields.name = name;
    if (address) orgFields.address = address;
    if (locations) orgFields.locations = locations;
    if (branding) orgFields.branding = branding;

    try {
        let organization = await Organization.findById(req.params.id);
        if (!organization) {
            return res.status(404).json({ msg: 'Organization not found' });
        }

        organization = await Organization.findByIdAndUpdate(
            req.params.id,
            { $set: orgFields },
            { new: true }
        );

        res.json(organization);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
