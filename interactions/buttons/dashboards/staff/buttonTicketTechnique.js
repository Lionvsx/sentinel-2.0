const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, reactionEmbedSelector, selectorReply, askForConfirmation, askYesOrNo, userResponseContent } = require('../../../../utils/functions/awaitFunctions')
const { getUsersFromString } = require('../../../../utils/functions/utilitaryFunctions')
const { createButtonActionRow, createButton } = require('../../../../utils/functions/messageComponents')
const { MessageEmbed, Permissions } = require('discord.js')
const mongoose = require('mongoose')
const Ticket = require('../../../../src/schemas/TicketSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')


module.exports = class TicketTechniqueButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonTicketTechnique', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.reply({
            content: `Check tes messages privés !`,
            ephemeral: true
        })

        const loading = client.emojis.cache.get('741276138319380583')

        const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
        ticketLogger.setGuild(interaction.guild)
        ticketLogger.setLogMember(interaction.member)

        const dmChannel = await interaction.user.createDM()
        const ticketContent = await userResponseContent(dmChannel, "Veuillez décrire votre problème ci dessous :").catch(err => console.log(err))
        if (!ticketContent) return;

        const tempMsg = await dmChannel.send(`**${loading} |** Création de votre ticket en cours`)

        ticketLogger.setLogData(ticketContent)

        const allChannels = interaction.guild.channels.cache

        const staffTechniqueRequestChannel = allChannels.get('742404106676862996')

        const ticketEmbed = new MessageEmbed().setDescription(`Merci d'avoir ouvert un ticket d'assistance pour le staff technique !\nUn administrateur sera bientôt avec vous pour traiter votre demande !`).setColor('#2ecc71')

        const ticketPermissions = [{ id: interaction.guild.roles.everyone.id, deny: Permissions.FLAGS.VIEW_CHANNEL }, { id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] }]


        const newChannel = await interaction.guild.channels.create(`🔧┃${interaction.user.username}`, {
            type: 'GUILD_TEXT',
            position: 100,
            permissionOverwrites: ticketPermissions,
            parent: allChannels.find(channel => channel.name.includes('📨tickets📨') && channel.type === 'GUILD_CATEGORY')
        })
        await newChannel.send({
            content: '@everyone',
            embeds: [ticketEmbed]
        })
        const newTicket = await Ticket.create({
            ticketChannelId: newChannel.id,
            guildId: newChannel.guild.id,
            authorId: interaction.user.id,
            name: interaction.user.username
        })
        await client.allTickets.set(newTicket.ticketChannelId, newTicket);

        const accessEmbed = new MessageEmbed()
            .setTitle(`🔧 NOUVEAU TICKET : \`${newTicket.name}\``)
            .setDescription(`Nouveau ticket de \`${interaction.user.username}\`\nDescription du problème : \`\`\`${ticketContent}\`\`\``)
            .setTimestamp()

        await staffTechniqueRequestChannel.send({
            embeds: [accessEmbed],
            components: [createButtonActionRow([createButton(`buttonAccessChannel|${newChannel.id}`, 'Accédez au ticket', 'SUCCESS'), createButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'DANGER')])]
        })
        tempMsg.edit(`**:white_check_mark: | **Votre ticket a été crée avec succès!`)
        ticketLogger.info(`<@!${interaction.user.id}> a crée un ticket d'assistance **bureau** avec le problème suivant :`)
    }
}

