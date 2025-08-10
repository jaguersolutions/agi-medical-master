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
        required: true,
        deprecated: true
    },
    locations: [{
        name: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        }
    }],
    users: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    subscription: {
        type: Schema.Types.ObjectId,
        ref: 'Subscription'
    },
    branding: {
        companyName: { type: String, trim: true },
        logoUrl: { type: String, trim: true },
        colorScheme: {
            primary: { type: String, trim: true },
            secondary: { type: String, trim: true },
            accent: { type: String, trim: true },
            text: { type: String, trim: true }
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
