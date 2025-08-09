const express = require('express');
const router = express.Router();
const config = require('config');
const { check, validationResult } = require('express-validator');

const Equipment = require('../../models/Equipment');

// Simple API Key authentication middleware for webhooks
const webhookAuth = (req, res, next) => {
    const apiKey = req.header('x-api-key');
    if (!apiKey) {
        return res.status(401).json({ msg: 'No API key, authorization denied' });
    }

    if (apiKey !== config.get('webhookApiKey')) {
        return res.status(403).json({ msg: 'Invalid API key' });
    }

    next();
};

// @route   POST api/webhooks/events
// @desc    Handle incoming webhook events
// @access  Private (API Key)
router.post(
    '/events',
    [
        webhookAuth,
        [
            check('event', 'Event type is required').isIn(['equipment_offline', 'equipment_online']),
            check('licenseKey', 'licenseKey is required').not().isEmpty()
        ]
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { event, licenseKey } = req.body;

        try {
            const equipment = await Equipment.findOne({ licenseKey });

            if (!equipment) {
                // We return a 200 OK even if the equipment isn't found
                // to prevent the webhook source from identifying valid license keys.
                // Log the issue for internal review.
                console.warn(`Webhook received event for unknown licenseKey: ${licenseKey}`);
                return res.status(200).send('Event received.');
            }

            switch (event) {
                case 'equipment_offline':
                    equipment.status = 'offline';
                    break;
                case 'equipment_online':
                    equipment.status = 'online';
                    break;
                default:
                    // This case should ideally not be hit due to the validator
                    console.warn(`Webhook received unhandled event type: ${event}`);
                    return res.status(200).send('Event received but not handled.');
            }

            equipment.lastSeen = Date.now();
            await equipment.save();

            console.log(`Webhook processed: ${event} for licenseKey ${licenseKey}`);
            res.status(200).json({ msg: 'Event processed successfully' });

        } catch (err) {
            console.error('Webhook processing error:', err.message);
            // Still send a 200 to the client to avoid retry storms, but log the error.
            res.status(200).send('Event received, but internal error occurred.');
        }
    }
);

module.exports = router;
