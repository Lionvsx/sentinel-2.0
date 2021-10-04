const BaseEvent = require('../../utils/structures/BaseEvent')
const mongoose = require('mongoose')

module.exports = class guildMemberRemove extends BaseEvent {
    constructor() {
        super('guildMemberRemove')
    }

    async run(client, guildMember) {
        if (guildMember.guild.id != '227470914114158592' || guildMember.user.bot === true) return;
        const User = await mongoose.model('User').findOne({ discordId: guildMember.user.id })

        if (User && User.id) {
            User.onServer = false;
            client.allUsers.delete(User.discordId)
            User.save();
        }
    }
}