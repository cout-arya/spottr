const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
        age: Number,
        gender: String,
        location: {
            type: { type: String, default: 'Point' },
            coordinates: { type: [Number], default: [0, 0] }
        },
        state: String,
        city: String,
        height: Number, // in cm
        weight: Number, // in kg
        dietaryPreference: { type: String, enum: ['Vegetarian', 'Non-vegetarian', 'Vegan', 'Eggetarian'] },
        fitnessLevel: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'] },
        goals: [String],
        gymType: String,
        diet: String,
        availability: [String],
        bio: String,
        photos: [String],
        // Enhanced Attributes
        experienceYears: Number,
        benchmarks: {
            squat: { type: String, default: 'None' },
            bench: { type: String, default: 'None' },
            deadlift: { type: String, default: 'None' }
        },
        commitment: { type: String, enum: ['Casual', 'Consistent', 'Hardcore'] },
        lifestyle: {
            smoker: { type: String, enum: ['Yes', 'No'] },
            alcohol: { type: String, enum: ['None', 'Occasional', 'Frequent'] },
            sleep: { type: String, enum: ['Early', 'Late', 'Irregular'] }
        },
        gymPersonality: { type: String, enum: ['Motivator', 'Silent grinder', 'Planner', 'Learner', 'Social'] }
    },
    gamification: {
        xp: { type: Number, default: 0 },
        level: { type: Number, default: 1 },
        streak: { type: Number, default: 0 },
        badges: [String]
    },
    preferences: {
        gender: String,
        ageRange: { min: Number, max: Number },
        maxDistance: Number // in km
    }
}, { timestamps: true });

UserSchema.index({ 'profile.location': '2dsphere' });

UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    // console.log(`Hashing password for ${this.email}`); // Debug log
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
