const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true
    },
    userTag: {
        type: String,
        required: true
    },
    avatarURL: {
        type: String,
        required: true
    },
    firstName: String,
    lastName: String,
    school: String,
    schoolYear: Number
})
const PresenceSchema = new mongoose.Schema({
    running: {
        type: Boolean,
        default: false
    },
    open: {
        type: Boolean,
        default: false
    },
    date: String,
    type: String,
    name: String,
    audience: [UserSchema],
    memberCheck: [UserSchema]
})

module.exports = mongoose.model('Presence', PresenceSchema);