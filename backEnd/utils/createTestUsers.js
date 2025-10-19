const User = require('../models/user.models');
const bcrypt = require('bcrypt');

const createTestUsers = async () => {
    try {
        // First check if we already have test users
        const existingUsers = await User.countDocuments({ role: "student" });
        if (existingUsers > 0) {
            console.log("Test users already exist, skipping creation");
            return;
        }

        const hashedPassword = await bcrypt.hash("testpass123", 10);

        const testUsers = [
            {
                fullname: "John Smith",
                username: "johnsmith",
                email: "john@test.com",
                password: hashedPassword,
                role: "student",
                gender: "male",
                college: "Test University",
                course: "Computer Science",
                year: 2,
                location: "New York",
                budget: { min: 8000, max: 12000 },
                preferences: { gender: "any" }
            },
            {
                fullname: "Emma Wilson",
                username: "emmawilson",
                email: "emma@test.com",
                password: hashedPassword,
                role: "student",
                gender: "female",
                college: "Test University",
                course: "Business",
                year: 3,
                location: "New York",
                budget: { min: 7000, max: 10000 },
                preferences: { gender: "any" }
            },
            {
                fullname: "Alex Johnson",
                username: "alexj",
                email: "alex@test.com",
                password: hashedPassword,
                role: "student",
                gender: "male",
                college: "Test University",
                course: "Engineering",
                year: 2,
                location: "Boston",
                budget: { min: 9000, max: 15000 },
                preferences: { gender: "any" }
            }
        ];

        // Create the test users
        await User.insertMany(testUsers);
        console.log("✅ Test users created successfully");
    } catch (error) {
        console.error("Error creating test users:", error);
    }
};

module.exports = { createTestUsers };