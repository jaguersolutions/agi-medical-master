const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const authorize = require('../../middleware/authorize');

const Equipment = require('../../models/Equipment');
const AuditLog = require('../../models/AuditLog');
const Organization = require('../../models/Organization');

// @route   GET api/reports/equipment
// @desc    Get an equipment report
// @access  Private
router.get('/equipment', auth, async (req, res) => {
    try {
        const { organizationId, location, status } = req.query;

        // Build the aggregation match pipeline
        const match = {};

        // AGI admins can query any organization, others are restricted to their own.
        const user = req.user;
        if (user.role !== 'agi_admin') {
            const userOrg = await User.findById(user.id).select('organization');
            match.organization = userOrg.organization;
        } else if (organizationId) {
            match.organization = mongoose.Types.ObjectId(organizationId);
        }

        if (location) {
            match.location = location;
        }
        if (status) {
            match.status = status;
        }

        const report = await Equipment.aggregate([
            { $match: match },
            {
                $lookup: {
                    from: 'organizations',
                    localField: 'organization',
                    foreignField: '_id',
                    as: 'organizationInfo'
                }
            },
            { $unwind: '$organizationInfo' },
            {
                $lookup: {
                    from: 'modules',
                    localField: 'moduleType',
                    foreignField: '_id',
                    as: 'moduleInfo'
                }
            },
            { $unwind: '$moduleInfo' },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    status: 1,
                    location: 1,
                    licenseKey: 1,
                    lastSeen: 1,
                    enrolledAt: 1,
                    organization: '$organizationInfo.name',
                    module: '$moduleInfo.name'
                }
            }
        ]);

        res.json(report);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/reports/audit
// @desc    Get a user audit log report
// @access  Private
router.get('/audit', [auth, authorize('manage_users', 'manage_organizations')], async (req, res) => {
    try {
        const { userId, action, startDate, endDate } = req.query;

        const match = {};

        // Restrict to own organization unless agi_admin
        if (req.user.role !== 'agi_admin') {
            const userOrg = await User.findById(req.user.id).select('organization');
            match.organization = userOrg.organization;
        }

        if (userId) match.user = mongoose.Types.ObjectId(userId);
        if (action) match.action = action;
        if (startDate || endDate) {
            match.timestamp = {};
            if (startDate) match.timestamp.$gte = new Date(startDate);
            if (endDate) match.timestamp.$lte = new Date(endDate);
        }

        const report = await AuditLog.find(match)
            .populate('user', 'name email')
            .sort({ timestamp: -1 });

        res.json(report);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   GET api/reports/summary
// @desc    Get a system-wide summary report
// @access  Private (agi_admin)
router.get('/summary', [auth, authorize('view_all_data')], async (req, res) => {
    try {
        const totalOrgs = await Organization.countDocuments();
        const totalEquipment = await Equipment.countDocuments();
        const onlineEquipment = await Equipment.countDocuments({ status: 'online' });

        const summary = {
            totalOrganizations: totalOrgs,
            totalEquipment: totalEquipment,
            onlineEquipment: onlineEquipment,
            offlineEquipment: totalEquipment - onlineEquipment
        };

        res.json(summary);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;
