const BaseCommand = require('../../utils/structures/BaseCommand')
const Discord = require('discord.js')

module.exports = class DisplayCommandsCommand extends BaseCommand {
    constructor () {
        super('commands', 'utilities', [], {
            usage: "commands <category>",
            description: "Affiche toutes les commandes",
            categoryDisplayName: `<:tool:1137412707629412453> Utilities`,
            userPermissions: [],
            clientPermissions: [],
            examples: ['commands moderation|Affiche toutes les commandes dans la catégorie \'moderation\'', 'commands|Affiche toutes les catégories'],
            serverOnly: false,
            admin: false,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const prefix = client.config.get(message.guild.id).prefix
        let array = Array.from(client.commands)
        if (!args[1]) {
            let categoriesEmbed = new Discord.MessageEmbed()
                .setColor('#2b2d31')
                .setAuthor(`${client.user.username} Commandes disponibles`, client.user.avatarURL())
                .setDescription(`Pour afficher toutes les commandes dans une catégorie :
                \`\`\`${prefix}commands <category>\`\`\``)

            let display = array.map(cmd => cmd[1].category)
            let categories = display.filter((x, i) => i === display.indexOf(x))
            categories.forEach(category => {
                let cmd = array.find(cmd => cmd[1].category === category)
                categoriesEmbed.addField(cmd[1].help.categoryDisplayName, `${array.filter(cmd => cmd[1].category === category).length} commands`, true)
            })
            await message.channel.send({
                embeds: [categoriesEmbed]
            })
        } else if (args[1]) {
            let selectedCategory = array.filter(cmd => cmd[1].category === args[1].toLowerCase())
            if (selectedCategory.length > 0) {
                let display = []
                let lengthDiv = 23
                selectedCategory.forEach(cmd => {
                    let spareLength = lengthDiv - cmd[1].name.length
                    let spare = Array(spareLength).fill(' ').join('')
                    display.push(`- ${cmd[1].name}${spare}:: ${cmd[1].help.description}`)
                })  
                message.channel.send(
                    `\`\`\`yaml\n${display.join('\n')}\`\`\`\n\nTapez \`\`${prefix}help <command>\`\` pour afficher les informations sur une commande spécifique !`
                )

            } else {
                message.channel.send(`**<:x_:1137419292946727042> | **Catégorie non valide, \`${prefix}commands\` pour afficher toutes les catégories`)
            }
        }
    }
}
