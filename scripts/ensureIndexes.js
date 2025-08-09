// scripts/ensureIndexes.js

const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

// We don't need to import the models to create indexes,
// as Mongoose's connection object gives us access to collections directly.
// This makes the script more decoupled from the model definitions.

const ensureIndexes = async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agi_medical';

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected for index verification...');

        const db = mongoose.connection;

        // --- Equipment Collection Indexes ---
        console.log('Ensuring indexes for: equipment');
        const equipmentCollection = db.collection('equipments');
        await equipmentCollection.createIndex({ organization: 1 });
        console.log('  - Index created for { organization: 1 }');
        await equipmentCollection.createIndex({ organization: 1, status: 1 });
        console.log('  - Compound index created for { organization: 1, status: 1 }');
        await equipmentCollection.createIndex({ organization: 1, moduleType: 1 });
        console.log('  - Compound index created for { organization: 1, moduleType: 1 }');
        // Note: unique indexes like 'licenseKey' are typically handled in the schema for validation,
        // but ensuring it here is also fine.
        await equipmentCollection.createIndex({ licenseKey: 1 }, { unique: true });
         console.log('  - Unique index created for { licenseKey: 1 }');


        // --- Users Collection Indexes ---
        console.log('Ensuring indexes for: users');
        const usersCollection = db.collection('users');
        await usersCollection.createIndex({ organization: 1 });
        console.log('  - Index created for { organization: 1 }');
        // Note: unique index for 'email' is best handled in the schema.
        await usersCollection.createIndex({ email: 1 }, { unique: true });
        console.log('  - Unique index created for { email: 1 }');


        // --- Subscriptions Collection Indexes ---
        console.log('Ensuring indexes for: subscriptions');
        const subscriptionsCollection = db.collection('subscriptions');
        await subscriptionsCollection.createIndex({ organization: 1 });
        console.log('  - Index created for { organization: 1 }');


        console.log('\nIndex verification and creation process completed successfully.');

    } catch (error) {
        console.error('Error during index creation:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

ensureIndexes();
