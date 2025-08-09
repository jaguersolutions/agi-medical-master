const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const equipmentSchema = new Schema({
    organization: {
        type: Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    moduleType: {
        type: Schema.Types.ObjectId,
        ref: 'Module',
        required: true
    },
    licenseKey: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },
    enrolledAt: {
        type: Date,
        default: Date.now
    },
    lastSeen: {
        type: Date
    }
});

const Equipment = mongoose.model('Equipment', equipmentSchema);

module.exports = Equipment;
