// scripts/seedRoles.js

const mongoose = require('mongoose');
const Role = require('../models/Role');
require('dotenv').config({ path: '../.env' }); // Adjust path to .env if necessary

const roles = [
    {
        name: 'agi_admin',
        description: 'Super administrator for the entire system.',
        permissions: [
            'manage_organizations',
            'manage_subscriptions',
            'create_modules',
            'add_licenses',
            'view_all_data'
        ]
    },
    {
        name: 'hospital_admin',
        description: 'Administrator for a specific hospital/clinic.',
        permissions: [
            'manage_users',
            'enroll_equipment',
            'view_organization_dashboard'
        ]
    },
    {
        name: 'doctor',
        description: 'Clinical role with access to detailed patient data.',
        permissions: [
            'view_patient_data',
            'view_equipment_status'
        ]
    },
    {
        name: 'nurse',
        description: 'Clinical role for patient monitoring.',
        permissions: [
            'view_patient_data',
            'view_equipment_status'
        ]
    },
    {
        name: 'technician',
        description: 'Role focused on hardware management.',
        permissions: [
            'manage_equipment_status',
            'view_equipment_status'
        ]
    },
    {
        name: 'ward_clerk',
        description: 'Administrative role with limited access.',
        permissions: [
            'view_equipment_status'
        ]
    },
    {
        name: 'read_only',
        description: 'Generic viewer role with no edit permissions.',
        permissions: [
            'view_organization_dashboard',
            'view_equipment_status'
        ]
    }
];

const seedRoles = async () => {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agi_medical';

    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB connected for seeding...');

        await Role.deleteMany({});
        console.log('Existing roles deleted.');

        await Role.insertMany(roles);
        console.log('Roles have been seeded successfully!');

    } catch (error) {
        console.error('Error seeding roles:', error);
    } finally {
        await mongoose.disconnect();
        console.log('MongoDB disconnected.');
    }
};

seedRoles();
