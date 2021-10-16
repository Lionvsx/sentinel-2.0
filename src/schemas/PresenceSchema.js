const mongoose = require(mongoose);

const UserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
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
    date: String,
    type: String,
    description: String,
    audience: [UserSchema],
    memberCheck: [UserSchema],
    memberNotChecked: [UserSchema]
})

module.exports = mongoose.model('Presence', PresenceSchema);