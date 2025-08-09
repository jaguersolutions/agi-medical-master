const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    permissions: {
        type: [String],
        required: true,
        default: []
    },
    description: {
        type: String
    }
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role;
