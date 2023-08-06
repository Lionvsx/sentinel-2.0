const BaseCommand = require('../../utils/structures/BaseCommand')
const { updateGuildMemberCache } = require('../../utils/functions/utilitaryFunctions')

module.exports = class MoveCommand extends BaseCommand {
    constructor () {
        super('move', 'moderation', [], {
            usage: "move <user>",
            description: "Deplace un utilisateur en vocal vers ton canal actuel",
            categoryDisplayName: `<:shield:1137411685716611143> Moderation`,
            userPermissions: ['MOVE_MEMBERS'],
            clientPermissions: [],
            examples: ['move Ominga|Deplace Ominga vers votre channel vocal s\'il est connecté à un channel vocal'],
            serverOnly: true,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        if (!args[1]) return message.channel.send(`**<:x_:1137419292946727042> | **Vous devez spécifier un utilisateur à déplacer !`)
        let guild = message.guild
        let allMembers = await updateGuildMemberCache(guild);

        args.shift()
        let searchTerms = args.join(' ')
        let invocationChannel = allMembers.get(message.author.id).voice.channel
        let targetMember = allMembers.find(m => m.user.username.toLowerCase().includes(searchTerms.toLowerCase()))
        if (!targetMember) return message.channel.send(`**<:x_:1137419292946727042> | **L'utilisateur spécifié est introuvable !`)
        if (!invocationChannel) return message.channel.send(`**<:x_:1137419292946727042> | **Vous devez être connecté à un channel vocal pour exécuter cette commande !`)
        if (!targetMember.voice.channel) return message.channel.send(`**<:x_:1137419292946727042> | **L'utilisateur spécifié n'es pas connecté dans un channel vocal !`)
        try {
            await targetMember.voice.setChannel(invocationChannel)
            message.channel.send(`**<:check:1137390614296678421> | **\`${targetMember.user.username}\` a été déplacé dans votre channel vocal !`)
        } catch (error) {
            message.channel.send(`**<:x_:1137419292946727042> | **L'utilisateur spécifié n'es pas connecté dans un channel vocal !`)
        }
    }
}