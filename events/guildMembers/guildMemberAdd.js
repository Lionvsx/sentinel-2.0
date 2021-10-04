const BaseEvent = require('../../utils/structures/BaseEvent')
const mongoose = require('mongoose')

module.exports = class guildMemberAdd extends BaseEvent {
    constructor() {
        super('guildMemberAdd')
    }

    async run(client, guildMember) {
        if (guildMember.guild.id != '227470914114158592' || guildMember.user.bot === true) return
        const existingUser = await mongoose.model('User').findOne({ discordId: guildMember.user.id, onServer: false });

        if (existingUser && existingUser.id) {
            existingUser.onServer = true;
            existingUser.username = guildMember.user.username
            existingUser.userTag = guildMember.user.tag
            existingUser.avatarURL = guildMember.user.displayAvatarURL();
            await existingUser.save();
        } else {
            mongoose.model('User').create({
                username: guildMember.user.username,
                discordId: guildMember.user.id,
                userTag: guildMember.user.tag,
                avatarURL: guildMember.user.displayAvatarURL(),
                onServer: true
            })
        }
    }
}