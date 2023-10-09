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
    duration: Number,
    link: String,
    type: {
        type: String,
        enum: ["meeting", "team-building", "event"],
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
    pole: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Event', EventSchema);