const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, askForConfirmation } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const { getUsersFromString } = require('../../../../utils/functions/utilitaryFunctions')
const Ticket = require('../../../../src/schemas/TicketSchema')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')

module.exports = class CustomTicketButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonCustomTicket', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.deferUpdate()

        const loading = client.emojis.cache.get('741276138319380583')

        const dmChannel = await interaction.user.createDM()
        const allChannels = interaction.guild.channels.cache
        const ticketName = await userResponseContent(dmChannel, "Veuillez donner un nom à votre ticket :").catch(err => console.log(err))
        if (!ticketName) return;
        const usersToAddString = await userResponseContent(dmChannel, `Quels utilisateurs/roles souhaitez vous rajouter au ticket : \`(pseudos discord/roles séparés d'une virgule, tapez \"aucun\" si il n'y en a aucun)\``).catch(err => console.log(err))
        if (!usersToAddString) return;

        const ticketLogger = new DiscordLogger('custom ticket', '#74b9ff')
        ticketLogger.setGuild(interaction.guild)
        ticketLogger.setLogMember(interaction.member)

        const ticketPermissions = [{ id: interaction.guild.roles.everyone.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] }, { id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL] }]

        let usersAudience = undefined
        if (usersToAddString != 'aucun') {
            usersAudience = await getUsersFromString(interaction.guild, usersToAddString.split(/\s*[,]\s*/))
            if (usersAudience.length === 0) return;
            for (const member of usersAudience) {
                ticketPermissions.push({ id: member.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL]})
            }
        }

        const confirmation = await askForConfirmation(dmChannel, `Etes vous sur de vouloir ouvrir un ticket custom avec les paramètres suivants : \`\`\`NOM: ${ticketName}\n\nUTILISATEURS:\n${usersAudience ? usersAudience.map(member => member.user.tag).join('\n') : 'Aucun'} \`\`\``).catch(err => console.log(err))
        if (!confirmation) return

        const tempMsg = await dmChannel.send(`**${loading} |** Création de votre ticket en cours`)
        ticketLogger.setLogData(`NOM: ${ticketName}\n\n${usersAudience ? usersAudience.map(member => member.user.tag).join('\n') : 'Aucun'}`)

        const ticketEmbed = new MessageEmbed()
            .setDescription(`🌐 Nouveau ticket personnalisé crée par \`${interaction.user.username}\``)
            .setColor('#74b9ff')

        const newChannel = await interaction.guild.channels.create(`🌐┃${ticketName}`, {
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
            name: ticketName
        })
        await client.allTickets.set(newTicket.ticketChannelId, newTicket);

        ticketLogger.info(`<@!${interaction.user.id}> a crée un ticket de **custom** avec les paramètres suivants :`)
        tempMsg.edit(`**:white_check_mark: | **Votre ticket a été crée avec succès!`)
        
    }
}