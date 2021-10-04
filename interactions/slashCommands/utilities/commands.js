const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { SlashCommandBuilder } = require('@discordjs/builders')
const Discord = require('discord.js')

module.exports = class CommandsInteraction extends BaseInteraction {
    constructor() {
        super('commands', 'utilities', 'slashCommand', {
            userPermissions: [],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('commands')
                .setDescription('Affiche toutes les commandes disponbibles')
                .addStringOption(option => 
                    option.setName('catégorie')
                        .setDescription('Affiche toutes les commandes d\'une catégorie spécifique')
                        .setRequired(false))
        })
    }

    async run(client, interaction) {
        const prefix = client.config.get(interaction.guild.id).prefix
        const categoryOption = interaction.options.get('catégorie')
        let array = Array.from(client.commands)
        if (!categoryOption) {
            let categoriesEmbed = new Discord.MessageEmbed()
                .setColor('#9b59b6')
                .setAuthor(`${client.user.username} Commandes disponibles`, client.user.avatarURL())
                .setDescription(`Pour afficher toutes les commandes dans une catégorie :
                \`\`\`${prefix}commands <category>\`\`\``)

            let display = array.map(cmd => cmd[1].category)
            let categories = display.filter((x, i) => i === display.indexOf(x))
            categories.forEach(category => {
                let cmd = array.find(cmd => cmd[1].category === category)
                categoriesEmbed.addField(cmd[1].help.categoryDisplayName, `${array.filter(cmd => cmd[1].category === category).length} commands`, true)
            })
            await interaction.reply({
                embeds: [categoriesEmbed]
            })
        } else if (categoryOption) {
            let selectedCategory = array.filter(cmd => cmd[1].category === categoryOption.value.toLowerCase())
            if (selectedCategory.length > 0) {
                let display = []
                let lengthDiv = 23
                selectedCategory.forEach(cmd => {
                    let spareLength = lengthDiv - cmd[1].name.length
                    let spare = Array(spareLength).fill(' ').join('')
                    display.push(`- ${cmd[1].name}${spare}:: ${cmd[1].help.description}`)
                })  
                interaction.reply(
                    `\`\`\`yaml\n${display.join('\n')}\`\`\`\n\nTapez \`\`${prefix}help <command>\`\` pour afficher les informations sur une commande spécifique !`
                )

            } else {
                interaction.reply(`**:x: | **Catégorie non valide, \`${prefix}commands\` pour afficher toutes les catégories`)
            }
        }
    }
}