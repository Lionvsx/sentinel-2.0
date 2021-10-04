const mongoose =  require('mongoose');

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
    isMember: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBureau: {
        type: Boolean,
        default: false
    },
    isResponsable: {
        type: Boolean,
        default: false
    },
    roleResponsable: String,
    onServer: {
        type: Boolean,
        required: true
    },
    firstName: String,
    lastName: String,
    school: String,
    schoolYear: Number,
    role: String,
});

module.exports = mongoose.model('User', UserSchema);