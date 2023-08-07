const BaseEvent = require('../../utils/structures/BaseEvent')
const mongoose = require('mongoose')

module.exports = class guildMemberUpdate extends BaseEvent {
    constructor() {
        super('guildMemberUpdate')
    }

    async run(client, oldGuildMember, newGuildMember) {
        if (oldGuildMember.guild.id !== '227470914114158592') return;
        if (oldGuildMember.user.bot) return;
        if (oldGuildMember.user.username === newGuildMember.user.username && oldGuildMember.user.displayAvatarURL() === newGuildMember.user.displayAvatarURL() && oldGuildMember.user.tag === newGuildMember.user.tag) return;

        const User = await mongoose.model('User').findOne({ discordId: newGuildMember.user.id })

        if (User && User.id) {
            User.username = newGuildMember.user.username
            User.avatarURL = newGuildMember.user.displayAvatarURL()
            User.userTag = newGuildMember.user.tag
            try {
                await User.save();
            } catch (error) {
                throw error;
            }
        }
    }
}