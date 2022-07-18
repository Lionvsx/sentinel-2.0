const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class CopyCategoryCommand extends BaseCommand {
    constructor () {
        super('copycategory', 'config', [], {
            usage: `copycategory <category ID>`,
            description: "Copie la catégorie avec l'ID renseigné",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: ['copycategory 758638202071285790|Copie la catégorie avec pour ID 758638202071285790'],
            serverOnly: true,
            admin: true,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const guild = message.guild
        const allChannels = guild.channels.cache
        if (!args[1]) return message.channel.send(`**:x: | **Arguments Invalides`)

        let categoryChan = allChannels.find(c => c.id === args[1])
        let childrenChans = allChannels.filter(c => c.parent === categoryChan)
        let clipboard = {
            category: {
                name: categoryChan.name,
                permissions: categoryChan.permissions,
                guildID: guild.id
            },
            childchannels: [
            ]
        }
        childrenChans.each(channel => {
            clipboard.childchannels.push({
                name: channel.name,
                permissions: channel.permissions,
                type: channel.type,
                position: channel.position
            })
        })
        client.clipboard.set(message.user.id, clipboard)
        message.channel.send(`**:white_check_mark: | **Categorie \`\`${categoryChan.name}\`\` copiée, utilisez \`\`/pastecategory\`\` pour la coller`)
    }
}
