const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');
const { check, validationResult } = require('express-validator');

const Subscription = require('../../models/Subscription');
const Organization = require('../../models/Organization');

// @route   POST api/subscriptions
// @desc    Create or update a subscription for an organization
// @access  Private (agi_admin)
router.post(
    '/',
    [
        auth,
        authorize('manage_subscriptions'),
        [
            check('organization', 'Organization ID is required').isMongoId(),
            check('modules', 'Modules are required and must be an array').isArray({ min: 1 }),
            check('modules.*.moduleType', 'Module Type ID is required for each module').isMongoId(),
            check('modules.*.quantity', 'Quantity is required and must be a number for each module').isNumeric()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { organization, modules, startDate, endDate, isActive } = req.body;

        try {
            // Check if organization exists
            const org = await Organization.findById(organization);
            if (!org) {
                return res.status(404).json({ msg: 'Organization not found' });
            }

            // A single organization should only have one active subscription document.
            // This logic will update an existing one or create a new one.
            let subscription = await Subscription.findOne({ organization });

            const subscriptionFields = {
                organization,
                modules,
                startDate,
                endDate,
                isActive
            };

            if (subscription) {
                // Update
                subscription = await Subscription.findOneAndUpdate(
                    { organization: organization },
                    { $set: subscriptionFields },
                    { new: true }
                );
                return res.json(subscription);
            }

            // Create
            subscription = new Subscription(subscriptionFields);
            await subscription.save();

            // Link subscription to the organization
            org.subscription = subscription.id;
            await org.save();

            res.json(subscription);
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   GET api/subscriptions/organization/:org_id
// @desc    Get subscription by organization ID
// @access  Private
router.get('/organization/:org_id', auth, async (req, res) => {
    try {
        const subscription = await Subscription.findOne({ organization: req.params.org_id }).populate('modules.moduleType', ['name']);

        if (!subscription) {
            return res.status(404).json({ msg: 'Subscription not found for this organization' });
        }

        res.json(subscription);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
