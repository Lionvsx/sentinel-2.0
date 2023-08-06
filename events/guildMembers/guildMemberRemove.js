const BaseEvent = require('../../utils/structures/BaseEvent')
const {deletePage} = require("../../utils/functions/notionFunctions");
const Users = require('../../src/schemas/UserSchema');

module.exports = class guildMemberRemove extends BaseEvent {
    constructor() {
        super('guildMemberRemove')
    }

    async run(client, guildMember) {
        if (guildMember.guild.id != '227470914114158592' || guildMember.user.bot === true) return;
        const User = await Users.findOne({ discordId: guildMember.user.id })

        if (User && User.id) {
            if (User && User.id && (User.isMember || User.isResponsable)) {
                User.isMember = false
                User.isResponsable = false
                User.isBureau = false
                User.roleResponsable = undefined
                User.school = undefined
                User.schoolYear = undefined
                User.roles = undefined

                if (User.isOnNotion && User.linkedNotionPageId) {
                    await deletePage(User.linkedNotionPageId)
                    User.isOnNotion = false
                    User.linkedNotionPageId = undefined
                    this.log("Notion config removed for " + guildMember.user.username)
                }
                await User.save();
                this.log(`${guildMember.user.username} => User removed from DB : left the server`)
            }
            User.onServer = false;
            client.allUsers.delete(User.discordId)
            User.save();
        }
    }
}

