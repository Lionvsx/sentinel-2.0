const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    authorId: String,
    authorTag: String,
    authorAvatarURL: String,
    createdAt: String,
    content: String,
});

const TicketSchema = new mongoose.Schema({
    ticketChannelId: {
        type: String,
        unique: true,
        required: true
    },
    name: String,
    authorId: String,
    guildId: {
        type: String,
        required: true
    },
    claimedByUserId: String,
    messages: [MessageSchema],
    archive: {
        type: Boolean,
        default: false
    }
})

module.exports = mongoose.model('Ticket', TicketSchema);