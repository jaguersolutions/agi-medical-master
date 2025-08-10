const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const auditLogSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true,
        trim: true
    },
    targetType: {
        type: String,
        required: true,
        enum: ['User', 'Equipment', 'Organization', 'Subscription', 'Role']
    },
    targetId: {
        type: Schema.Types.ObjectId,
        required: true
    },
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    details: {
        type: Schema.Types.Mixed // Allows for flexible storage of action-specific details
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

auditLogSchema.index({ user: 1 });
auditLogSchema.index({ organization: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
