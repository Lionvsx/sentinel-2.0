const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class DeleteAllAloneCommand extends BaseCommand {
    constructor () {
        super('deleteallalone', 'config', [], {
            usage: "deleteallalone",
            description: "Supprime tout les channels sans catégorie",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            hide: false,
            admin: true,
            home: false
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
        await tempMsg.edit(`**:white_check_mark: |** Opération terminée`)
    }
}



