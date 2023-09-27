const mongoose = require('mongoose');

const RSVPSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    attending: {
        type: String,
        enum: ["yes", "no", "maybe"],
        default: "no",
        required: true
    }
})
const EventSchema = new mongoose.Schema({
    name: String,
    description: String,
    discordTimestamp: Number,
    nbGames: Number,
    duration: Number,
    trackerLink: String,
    type: {
        type: String,
        enum: ["match", "training", "tournament", "other", "review", "meeting", "team-building", "scrim", "pracc"],
        default: "other",
        required: true
    },
    attendance: {
        type: Boolean,
        required: true
    },
    rsvps: [RSVPSchema],
    slots: Number,
    messageId: String,
    archived: {
        type: Boolean,
        default: false
    },
    score: String,
    result: String,
});


const AvailabilitySchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        required: true
    },
    hour: {
        type: Number,
        min: 0,
        max: 23,
        required: true
    },
    weekNumber: {
        type: Number,
        min: 1,
        max: 52,
        required: true
    },
    availability: {
        type: String,
        enum: ["available", "unavailable", "maybe"],
        required: true
    },
    discordId: {
        type: String,
        required: true
    }
});

const TeamSchema = new mongoose.Schema({
    linkedCategoryId: {
        type: String,
        required: true,
        unique: true
    },
    linkedRoleId: {
        type: String,
        required: true,
        unique: true
    },
    linkedNotionPageId: {
        type: String,
        required: true,
        unique: true
    },
    emoji: String,
    name: String,
    game: String,
    smartManager: Boolean,
    events: [EventSchema],
    availabilities: [AvailabilitySchema],
    availabilitiesAnswered: Number,
    playersAnswered: [String],
    planningSent: Boolean,
    minPlayers: Number,
    trainTags: [String],
    sport: Boolean,
    trainingTime: Number,
    dashboardChannelId: String,
    customPrompt: String,
});

module.exports = mongoose.model('Team', TeamSchema);