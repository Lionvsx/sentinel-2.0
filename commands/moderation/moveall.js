const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class MoveAllCommand extends BaseCommand {
    constructor () {
        super('moveall', 'moderation', [], {
            usage: "moveall <channel>",
            description: "Deplace tout les utilisateurs dans un channel vers ton channel",
            categoryDisplayName: `🛡️ Moderation`,
            userPermissions: ['MOVE_MEMBERS'],
            clientPermissions: [],
            examples: ['moveall AFK|Deplace tous les utilisateurs connectés dans le channel AFK vers votre channel actuel !'],
            serverOnly: true,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (bot, message, args) {
        if (!args[1]) return message.channel.send(`**:x: | **Vous devez selectionner un channel !`)
        let guild = message.guild
        let allMembers = guild.members.cache
        let allChannels = guild.channels.cache

        args.shift()
        let searchTerms = args.join(' ')
        let invocationChannel = allMembers.get(message.author.id).voice.channel
        let targetChannel = allChannels.get(args[0])
        if (!targetChannel) targetChannel = allChannels.find(c => c.name.toLowerCase().includes(searchTerms.toLowerCase()))
        if (!targetChannel) return message.channel.send(`**:x: | **Channel spécifié introuvable !`)
        if (targetChannel.type != 'voice') return message.channel.send(`**:x: | **Le channel spécifié n'es pas un channel vocal !`)
        if (!invocationChannel) return message.channel.send(`**:x: | **Vous devez être connecté à un channel vocal pour exécuter cette commande !`)
        if (invocationChannel === targetChannel) return message.channel.send(`**:x: | **Vous ne pouvez pas déplacer des personnes à partir de votre propre channel vers votre propre channel`)
        let count = 0
        let errors = 0
        targetChannel.members.each(member => {
            try {
                member.voice.setChannel(invocationChannel)
                count++
            } catch (error) {
                errors++
            }
        })
        await message.channel.send(`**:white_check_mark: | **\`${count}\` utilisateurs déplacés vers votre channel avec \`${errors}\` erreurs`) 
    }
}