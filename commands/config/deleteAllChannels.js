const BaseCommand = require('../../utils/structures/BaseCommand')
const {sleep} = require("../../utils/functions/utilitaryFunctions");

module.exports = class DeleteAllCommand extends BaseCommand {
    constructor () {
        super('deleteall', 'config', [], {
            usage: "deleteall <id>",
            description: "Supprime une catégorie + tout les channels de cette catégorie",
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
        let selectedChannel = client.channels.cache.filter(c => c.id === args[1])


        if (selectedChannel.get(args[1]).type === "GUILD_CATEGORY") {
            let childChannels = selectedChannel.get(args[1]).children
            let tempMsg = await message.channel.send(`**${loading} |** Suppression de tous les channels dans la catégorie \`${selectedChannel.name}\``)
            await childChannels.each(channel => {
                channel.delete()
            })
            await tempMsg.edit(`**:white_check_mark: |** Opération terminée`)
            await sleep(1000)
            selectedChannel.delete();
        }
    }
}

