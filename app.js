const express = require('express');
const mongoose = require('mongoose');
const { exec } = require('child_process');

// Load environment variables
// require('dotenv').config(); // Uncomment when you have a .env file

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database Connection
// const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agi_medical';
// For now, we will not connect to a live DB until routes are created.
// mongoose.connect(MONGO_URI)
//     .then(() => console.log('MongoDB connected...'))
//     .catch(err => console.log(err));

// Import Mongoose Models
const Organization = require('./models/Organization');
const User = require('./models/User');
const Module = require('./models/Module');
const Subscription = require('./models/Subscription');
const Equipment = require('./models/Equipment');

// Basic Route
app.get('/', (req, res) => {
    res.send('Welcome to the AGI AI-MEDICAL API');
});

// Placeholder for running Python scripts
function runPythonScript(scriptPath, args, callback) {
    const command = `python ${scriptPath} ${args.join(' ')}`;
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            return callback(error, null);
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
        callback(null, stdout);
    });
}

// Example usage of runPythonScript (can be integrated into a route later)
// runPythonScript('path/to/your/script.py', ['arg1', 'arg2'], (err, result) => {
//     if (err) {
//         return console.log('Error running python script');
//     }
//     console.log('Python script output:', result);
// });


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
