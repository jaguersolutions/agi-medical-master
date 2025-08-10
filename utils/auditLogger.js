const AuditLog = require('../models/AuditLog');

/**
 * Creates an audit log entry.
 * @param {object} options - The options for the audit log.
 * @param {string} options.user - The ID of the user performing the action.
 * @param {string} options.organization - The ID of the organization.
 * @param {string} options.action - A description of the action.
 * @param {string} options.targetType - The model name of the target document.
 * @param {string} options.targetId - The ID of the target document.
 * @param {object} [options.details] - Optional additional details to store.
 */
const logAction = async ({ user, organization, action, targetType, targetId, details = {} }) => {
    try {
        const log = new AuditLog({
            user,
            organization,
            action,
            targetType,
            targetId,
            details
        });
        await log.save();
    } catch (error) {
        // In a production environment, you might want to log this error to a different system
        // rather than just the console, but for now, this is sufficient.
        console.error('Failed to save audit log:', error);
    }
};

module.exports = logAction;
