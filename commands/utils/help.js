const BaseCommand = require('../../utils/structures/BaseCommand')
const Discord = require('discord.js')

module.exports = class HelpCommand extends BaseCommand {
    constructor () {
        super('help', 'utilities', ['h'], {
            usage: "help <command>",
            description: "Afficher les informations sur les commandes du bot",
            categoryDisplayName: `🔧 Utilities`,
            userPermissions: [],
            clientPermissions: [],
            examples: ['help|Affiche le menu de Sentinel', 'help ping|Affiche des informations détaillées sur la commande \'ping\''],
            serverOnly: false,
            home: false,
            admin: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        const prefix = client.config.get(message.guild.id).prefix
        if (!args[1]) {
            let helpEmbed = new Discord.MessageEmbed()
                .setDescription(`**INFORMATIONS SUR UNE COMMANDE**\n\`${prefix}help <command>\`\n\n**LISTE DE TOUTES LES COMMANDES**\n\`${prefix}commands\`\n\n**LIENS UTILES**\n[Site LDV Esport](https://ldvesport.com)`)
                .setColor('#1abc9c')
            message.channel.send({
                embeds: [helpEmbed]
            })
        } else if (args[1]) {
            let command = client.commands.get(args[1])
            if (command) {
                let embed = new Discord.MessageEmbed()
                    .setTitle(`${command.category.toUpperCase()} | ${command.name.toUpperCase()} COMMAND`)
                    .setDescription(command.help.description)
                    .addField("Usage",`\`${prefix}${command.help.usage}\``)
                    .setColor('#1abc9c')

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
                await message.channel.send({
                    embeds: [embed]
                })
            } else {
                message.channel.send(`**:x: | **Cette commande n'existe pas !`)
            }
        }
    }
}