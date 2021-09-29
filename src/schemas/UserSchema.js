const mongoose =  require('mongoose');

const AssoSchema = new mongoose.Schema({
    assoName: {
        type: String,
        required: true
    },
    userStatus: String,
    userIsBan: Boolean,
});

const UserSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        required: true
    },
    avatarURL: {
        type: String,
        required: true
    },
    isMod: {
        type: Boolean,
        default: false
    },
    isSpMod: {
        type: Boolean,
        default: false
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isReferent: {
        type: Boolean,
        default: false
    },
    school: String,
    schoolYear: Number,
    assosAsStaff: [AssoSchema],
    assosAsVisitor: [AssoSchema],
});

module.exports = mongoose.model('User', UserSchema);