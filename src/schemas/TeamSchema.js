const mongoose = require('mongoose');

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
    game: String
});

module.exports = mongoose.model('Team', TeamSchema);