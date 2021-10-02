const mongoose = require('mongoose');

const ReactionChannelsSchema = new mongoose.Schema({
    messageId: {
        type: String,
        unique: true,
        required: true
    },
    guildId: {
        type: String,
        required: true
    },
    authorId: String,
    linkedChannelId: {
        type: String,
        required: true
    }
})