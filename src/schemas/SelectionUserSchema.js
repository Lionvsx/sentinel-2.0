const mongoose =  require('mongoose');

const SelectionUserSchema = new mongoose.Schema({
    discordId: {
        type: String,
        required: true,
        unique: true
    },
    userTag: {
        type: String,
        required: true
    },
    avatarURL: {
        type: String,
        required: true
    },
    isOnNotion: {
        type: Boolean,
        default: false
    },
    linkedNotionPageId: String,
});

module.exports = mongoose.model('SelectionUser', SelectionUserSchema);