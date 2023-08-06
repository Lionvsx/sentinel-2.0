const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class CopyCategoryCommand extends BaseCommand {
    constructor () {
        super('copycategory', 'config', [], {
            usage: `copycategory <category ID>`,
            description: "Copie la catégorie avec l'ID renseigné",
            categoryDisplayName: `<:settings:1137410884432564404> Config`,
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
        if (!args[1]) return message.channel.send(`**<:x_:1137419292946727042> | **Arguments Invalides`)

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
        client.clipboard.set(message.author.id, clipboard)
        message.channel.send(`**<:check:1137390614296678421> | **Categorie \`\`${categoryChan.name}\`\` copiée, utilisez \`\`/pastecategory\`\` pour la coller`)
    }
}
