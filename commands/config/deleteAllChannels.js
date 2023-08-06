const BaseCommand = require('../../utils/structures/BaseCommand')
const {sleep} = require("../../utils/functions/utilitaryFunctions");

module.exports = class DeleteAllCommand extends BaseCommand {
    constructor () {
        super('deleteall', 'config', [], {
            usage: "deleteall <id>",
            description: "Supprime une catégorie + tout les channels de cette catégorie",
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
        let selectedChannel = client.channels.cache.filter(c => c.id === args[1])


        if (selectedChannel.get(args[1]).type === "GUILD_CATEGORY") {
            let childChannels = selectedChannel.get(args[1]).children
            let tempMsg = await message.channel.send(`**${loading} |** Suppression de tous les channels dans la catégorie \`${selectedChannel.name}\``)
            await childChannels.each(channel => {
                channel.delete()
            })
            await tempMsg.edit(`**<:check:1137390614296678421> |** Opération terminée`)
            await sleep(1000)
            selectedChannel.delete();
        }
    }
}

