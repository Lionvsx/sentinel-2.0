const BaseCommand = require('../../utils/structures/BaseCommand')
const {Permissions} = require("discord.js");

module.exports = class CopyCategoryCommand extends BaseCommand {
    constructor () {
        super('pastecategory', 'config', [], {
            usage: "pastecategory",
            description: "Colle la dernière catégorie copiée",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: ['pastecategory|Colle la dernière catégorie copiée'],
            serverOnly: true,
            admin: true,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const guild = message.guild

        let savedCategory = client.clipboard.get(message.author.id)

        if (savedCategory.category.guildID === guild.id) {
            guild.channels.create(savedCategory.category.name, {
                type: 'category',
                position: 1,
                permissionOverwrites: savedCategory.category.permissions,
            }).then(categoryChannel => {
                savedCategory.childchannels.forEach(childChannel => {
                    guild.channels.create(childChannel.name, {
                        type: childChannel.type,
                        position: childChannel.position,
                        permissionOverwrites: childChannel.permissions,
                        parent: categoryChannel
                    })
                })
            })
        } else {
            guild.channels.create(savedCategory.category.name, {
                type: 'category',
                position: 1,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: ['VIEW_CHANNEL']
                    }
                ],
            }).then(categoryChannel => {
                savedCategory.childchannels.forEach(childChannel => {
                    guild.channels.create(childChannel.name, {
                        type: childChannel.type,
                        position: childChannel.position,
                        permissionOverwrites: [
                            {
                                id: guild.roles.everyone.id,
                                deny: ['VIEW_CHANNEL']
                            }
                        ],
                        parent: categoryChannel
                    })
                })
            })
        }
        message.channel.send(`**:white_check_mark: | **Categorie collée !`)

    }
}
