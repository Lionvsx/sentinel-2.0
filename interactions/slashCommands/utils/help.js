const BaseInteraction = require('../../../utils/structures/BaseInteraction')
const { SlashCommandBuilder } = require('@discordjs/builders')
const { MessageEmbed } = require('discord.js')

module.exports = class HelpInteraction extends BaseInteraction {
    constructor () {
        super('help', 'utilities', 'slashCommand', {
            userPermissions: [],
            clientPermissions: [],
            commandData: new SlashCommandBuilder()
                .setName('help')
                .setDescription('Affiche la documentation des différentes commandes du bot !')
                .addStringOption(option =>
                    option.setName('commande')
                        .setDescription('Commande dont vous souhaitez avoir la documentation')
                        .setRequired(false))
        })
    }

    async run (client, interaction) {
        const prefix = client.config.get(interaction.guild.id).prefix
        const channel = interaction.channel
        const commandOption = interaction.options.get('commande')
        if (!commandOption) {
            let helpEmbed = new MessageEmbed()
                .setDescription(`**INFORMATIONS SUR UNE COMMANDE**\n\`${prefix}help <command>\`\n\n**LISTE DE TOUTES LES COMMANDES**\n\`${prefix}commands\`\n\n**LIENS UTILES**\n[Site LDV Esport](https://ldvesport.com)`)
                .setColor('2b2d31')
            interaction.reply({
                embeds: [helpEmbed]
            })
        } else if (commandOption) {
            let command = client.commands.get(commandOption.value)
            if (command) {
                let embed = new MessageEmbed()
                    .setTitle(`${command.category.toUpperCase()} | ${command.name.toUpperCase()} COMMAND`)
                    .setDescription(command.help.description)
                    .addField("Usage",`\`${prefix}${command.help.usage}\``)
                    .setColor('2b2d31')

                let cmdargs = command.help.arguments
                if (cmdargs) embed.addField("Arguments", cmdargs)
                let examples = command.help.examples
                if (examples && examples.length != 0) {
                    let strExamples = []
                    examples.forEach(async (example) => {
                        let exampleArguments = example.split('|')
                        let textExample = `\`${prefix}${exampleArguments[0]}\` - ${exampleArguments[1]}`
                        strExamples.push(textExample)
                    })
                    let exampleText = strExamples.join('\n')
                    embed.addField("Exemples", exampleText)
                }
                let aliases = command.aliases
                if (aliases && aliases.length != 0) {
                    let aliasesToString = aliases.join(', ')
                    embed.addField("Alias", `\`${aliasesToString}\``)
                }
                await interaction.reply({
                    embeds: [embed]
                })
            } else {
                interaction.reply(`**<:x_:1137419292946727042> | **Cette commande n'existe pas !`)
            }
        }
    }
}