const BaseCommand = require('../../utils/structures/BaseCommand')
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions')

module.exports = class MoveAllCommand extends BaseCommand {
    constructor () {
        super('muteall', 'moderation', [], {
            usage: "mutall",
            description: "Mute tout les autres utilisateurs de ton channel",
            categoryDisplayName: `<:shield:1137411685716611143> Moderation`,
            userPermissions: ['KICK_MEMBERS'],
            clientPermissions: [],
            examples: ['muteall|Mute tout les utilisateurs du channel vocal auquel tu es connecté excepté toi même'],
            serverOnly: true,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const guild = message.guild
        const allMembers = await updateGuildMemberCache(guild);
        const invocationChannel = allMembers.get(message.author.id).voice.channel

        let toMute = invocationChannel.members.filter(m => !m.permissions.has('MUTE_MEMBERS'))
        toMute.each(member => {
            try {
                member.voice.setMute(true)
            } catch (error) {
                console.log(error)
            }
        })
        message.channel.send(`**<:check:1137390614296678421> | **\`${toMute.size}\` membre(s) mute(s) avec succès !`)
    }
}