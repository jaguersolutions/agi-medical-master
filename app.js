const express = require('express');
const mongoose = require('mongoose');
const config = require('config');

// Load environment variables
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || config.get('port') || 3000;

// Connect to Database
const MONGO_URI = process.env.MONGO_URI || config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB Connected...');
    } catch (err) {
        console.error(err.message);
        // Exit process with failure
        process.exit(1);
    }
};
connectDB();


// Init Middleware
app.use(express.json({ extended: false }));


// Define Routes
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/equipment', require('./routes/api/equipment'));
app.use('/api/webhooks', require('./routes/api/webhooks'));
app.use('/api/roles', require('./routes/api/roles'));
app.use('/api/organizations', require('./routes/api/organizations'));
app.use('/api/subscriptions', require('./routes/api/subscriptions'));
app.use('/api/users', require('./routes/api/users'));


app.get('/', (req, res) => {
    res.send('AGI AI-MEDICAL API is running');
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
