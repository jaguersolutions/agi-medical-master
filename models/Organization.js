const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const organizationSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
