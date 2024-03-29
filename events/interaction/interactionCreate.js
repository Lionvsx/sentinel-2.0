const BaseEvent = require('../../utils/structures/BaseEvent');

module.exports = class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super('interactionCreate')
    }

    async run(client, interaction) {
        if (interaction.user.bot) return
        if (!interaction.inGuild()) return
        if (interaction.isCommand()) {
            let command = client.interactions.get(interaction.commandName)
            if (command) {
                if (!interaction.guild.members.cache.get(interaction.user.id).permissions.has(command.help.userPermissions)) return interaction.reply({ content: `**<:x_:1137419292946727042> | **Vous n'avez pas la permission pour executer cette commande !` })
                if (!interaction.guild.members.cache.get(client.user.id).permissions.has(command.help.clientPermissions)) return interaction.reply({ content: `**<:x_:1137419292946727042> | **Je n'ai pas la permission pour executer cette commande !` })
                command.run(client, interaction)
            }
        } else if (interaction.isButton()) {
            const buttonArgs = interaction.customId.split('|')
            let buttonInteraction = client.interactions.get(buttonArgs[0])
            if (buttonInteraction) {
                if (!interaction.guild.members.cache.get(interaction.user.id).permissions.has(buttonInteraction.help.userPermissions)) return interaction.reply({ content: `**<:x_:1137419292946727042> | **Vous n'avez pas la permission pour executer cette commande !`, ephemeral: true })
                buttonInteraction.run(client, interaction, buttonArgs)
            }
        } else if (interaction.isSelectMenu()) {
            const selectMenuArgs = interaction.customId.split('|')
            let selectMenu = client.interactions.get(selectMenuArgs[0])
            if (selectMenu) {
                if (!interaction.guild.members.cache.get(interaction.user.id).permissions.has(selectMenu.help.userPermissions)) return interaction.reply({ content: `**<:x_:1137419292946727042> | **Vous n'avez pas la permission pour executer cette commande !`, ephemeral: true })
                selectMenu.run(client, interaction, selectMenuArgs)
            }
        }
    }
}
