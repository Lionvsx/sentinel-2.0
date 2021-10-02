const mongoose =  require('mongoose');

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
    isAdmin: {
        type: Boolean,
        default: false
    },
    school: String,
    schoolYear: Number,
    role: String,
       
});

module.exports = mongoose.model('User', UserSchema);