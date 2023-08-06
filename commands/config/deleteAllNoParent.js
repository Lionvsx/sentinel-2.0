const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class DeleteAllAloneCommand extends BaseCommand {
    constructor () {
        super('deleteallalone', 'config', [], {
            usage: "deleteallalone",
            description: "Supprime tout les channels sans catégorie",
            categoryDisplayName: `<:settings:1137410884432564404> Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const loading = client.emojis.cache.get('741276138319380583')
        let allChannels = message.guild.channels.cache

        let tempMsg = await message.channel.send(`**${loading} |** Suppression de tous les channels sans catégorie`)
        await allChannels.each(channel => {
            if (!channel.parent) {
                if (channel.type !== 'GUILD_CATEGORY') {
                    channel.delete()
                }
            }
        })
        await tempMsg.edit(`**<:check:1137390614296678421> |** Opération terminée`)
    }
}



