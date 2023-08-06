const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponse, selectorReply, askForConfirmation, askYesOrNo, userResponseContent } = require('../../../../utils/functions/awaitFunctions')
const { getUsersFromString, updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const { createButtonActionRow, createEmojiButton } = require('../../../../utils/functions/messageComponents')
const { MessageEmbed, Permissions } = require('discord.js')
const mongoose = require('mongoose')
const Ticket = require('../../../../src/schemas/TicketSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')


module.exports = class TicketBureauButton extends BaseInteraction {
    constructor() {
        super('buttonTicketBureau', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate()

        let mode = "server"

        let guild = interaction.guild
        if (!guild) {
            guild = await client.guilds.cache.get("227470914114158592")
            mode = "dm"
        }

        const loading = client.emojis.cache.get('741276138319380583')
        
        const ticketLogger = new DiscordLogger('tickets', '#ffeaa7')
        ticketLogger.setGuild(guild)
        ticketLogger.setLogMember(interaction.member)

        const dmChannel = await interaction.user.createDM()
        const ticketContent = await userResponseContent(dmChannel, "Veuillez décrire votre problème ci dessous :").catch(err => console.log(err))
        if (!ticketContent) return;

        const tempMsg = await dmChannel.send(`**${loading} |** Création de votre ticket en cours`)

        ticketLogger.setLogData(ticketContent)

        const allChannels = guild.channels.cache

        const bureauRequestChannel = allChannels.get('742403764211679342')

        const ticketEmbed = new MessageEmbed().setDescription(`Merci d'avoir ouvert un ticket d'assistance pour le bureau !\nUn membre du bureau sera bientôt avec vous pour traiter votre demande !`).setColor('2b2d31')

        const ticketPermissions = [{ id: guild.roles.everyone.id, deny: Permissions.FLAGS.VIEW_CHANNEL }, { id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] }]


        const newChannel = await guild.channels.create(`💼┃${interaction.user.username}`, {
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
            .setTitle(`💼 NOUVEAU TICKET : \`${newTicket.name}\``)
            .setDescription(`Nouveau ticket de \`${interaction.user.username}\`\nDescription du problème : \`\`\`${ticketContent}\`\`\``)
            .setTimestamp()
            .setColor('2b2d31')

        await bureauRequestChannel.send({
            embeds: [accessEmbed],
            components: [createButtonActionRow([createEmojiButton(`buttonAccessChannel|${newChannel.id}`, 'Accédez au ticket', 'SECONDARY', '<:pluscircle:1137390650690650172>'), createEmojiButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'SECONDARY', '<:x_:1137419292946727042>')])]
        })


        if (mode === "dm") {
            const embed = new MessageEmbed()
                .setTitle(`**MISE A JOUR DE VOTRE STATUT**`)
                .setDescription(`Votre statut en tant que membre de LDV Esport a été modifié : vous avez été retiré de la base de données des membres de LDV Esport\nVotre ticket a bien été créé, le bureau vous répondra sur le serveur dans les plus brefs délais !`)
                .setColor('2b2d31')

            interaction.message.edit({
                embeds: [embed],
                components: []
            })
        }
        await tempMsg.edit(`**<:check:1137390614296678421> | **Votre ticket a été crée avec succès!`)
        await ticketLogger.info(`<@!${interaction.user.id}> a crée un ticket d'assistance **bureau** avec le problème suivant :`)
    }
}

