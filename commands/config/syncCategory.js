const BaseCommand = require('../../utils/structures/BaseCommand')
const {Permissions} = require("discord.js");

module.exports = class CopyCategoryCommand extends BaseCommand {
    constructor () {
        super('synccategory', 'config', [], {
            usage: "synccategory <category ID>",
            description: "Synchronise tout les channels enfants de la catégorie avec l'ID renseigné",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: ['synccategory 758638202071285790|Synchronise les channels enfants de la catégorie avec pour ID 758638202071285790'],
            hide: false,
            admin: true,
            home: false
        });
    }

    async run (client, message, args) {
        const guild = message.guild
        const allChannels = guild.channels.cache
        if (!args[1]) return message.channel.send(`**:x: | **Arguments Invalides`)

        let categoryChan = allChannels.find(c => c.id === args[1])
        let childrenChans = allChannels.filter(c => c.parent === categoryChan)

        childrenChans.each(channel => {
            channel.lockPermissions()
        })
        message.channel.send(`**:white_check_mark: | **Tout les channels de la catégorie \`\`${categoryChan.name}\`\` ont été synchronisés`)
    }
}
