const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const moduleSchema = new Schema({
    name: {
        type: String,
        required: true,
        enum: ['Patient Monitor', 'Fetal Monitor', 'ECG']
    },
    description: {
        type: String
    }
});

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
