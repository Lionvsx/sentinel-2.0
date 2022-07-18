const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class CreateCategoryCommand extends BaseCommand {
    constructor () {
        super('closecategory', 'config', [], {
            usage: "closecategory <category ID>",
            description: "Ferme la catégorie avec l'ID renseigné",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: ['closecategory 758638202071285790|Ferme la catégorie avec pour ID 758638202071285790'],
            hide: false,
            admin: true,
            home: false
        });
    }

    async run (client, message, args) {
        const guild = message.guild
        const allChannels = guild.channels.cache
        if (!args[1]) return

        let category = allChannels.find(c => c.id === args[1])
        let childrenChans = allChannels.filter(c => c.parent === category)
        childrenChans.each(channel => {
            channel.overwritePermissions([
                {
                    id: guild.roles.everyone.id,
                    deny: ['VIEW_CHANNEL']
                }
            ])
        })
    }
}
