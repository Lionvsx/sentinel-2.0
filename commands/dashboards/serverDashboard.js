const { MessageEmbed, Permissions, MessageActionRow, MessageButton } = require('discord.js');
const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    createButtonActionRow,
    createEmojiButton,
    createButton
} = require('../../utils/functions/messageComponents');
const { getDateTime } = require('../../utils/functions/systemFunctions');
const mongoose = require('mongoose');

module.exports = class DashDatabaseCommand extends BaseCommand {
    constructor () {
        super('dashboarddb', 'dashboard', [], {
            usage: "dashboarddb",
            description: "Crée un dashboard pour gérer le serveur",
            categoryDisplayName: `🧭 Dashboard`,
            userPermissions: ['ADMINISTRATOR'],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            home: true,
            subCommands: false
        });
    }

    async run (client, message, args) {

        const GuildDashboard = new MessageEmbed()
            .setTitle(`SERVEURS QUI HEBERGENT SENTINEL`)
            .setDescription(`\`\`\`LAST UPDATED ON : ${getDateTime()}\`\`\``)
            .addFields({ name: '\u200B', value: '\u200B' })
        
        for (const [guildId, guild] of client.guilds.cache) {
            const guildConfig = await mongoose.model('Guild').findOne({ guildId: guildId });
            const sentinelMember = await guild.members.fetch(client.user.id)
            const sentinelLevel = sentinelMember.permissions.has(Permissions.FLAGS.ADMINISTRATOR) ? 'ADMIN' : sentinelMember.permissions.has(Permissions.FLAGS.MANAGE_CHANNELS) && sentinelMember.permissions.has(Permissions.FLAGS.MANAGE_ROLES) && sentinelMember.permissions.has(Permissions.FLAGS.MANAGE_MESSAGES) ? 'MODERATOR' : 'USER'

            GuildDashboard.addField(guild.name, `\`\`\`css\nMEMBERS [${guild.memberCount}]\nSLASH COMMANDS [${guildConfig.slashCommands ? 'ENABLED' : 'DISABLED'}]\nLOG CHANNEL [${guildConfig.logChannelId ? guild.channels.cache.get(guildConfig.logChannelId)?.name : 'NOT SET'}]\nOWNER [${guild.members.cache.get(guild.ownerId)?.user.tag}]\nSENTINEL LEVEL [${sentinelLevel}]\`\`\``, true)
        }
        const GuildDashboardRow1 = createButtonActionRow([
            createEmojiButton('buttonRefreshGuildDashboard', 'Mettre à jour les données', 'SUCCESS', '🔄'),
            createEmojiButton('buttonSlashCommands', 'Gérer les (/) commands', 'PRIMARY', '⚡'),
            createEmojiButton('buttonDisplayGuildUsers', 'Afficher les utilisateurs', 'PRIMARY', '👥')
        ])
        const GuildDashboardRow2 = createButtonActionRow([
            createEmojiButton('broadcastMessage', 'Envoie un message d\'annonce à distance', 'DANGER', '✉')
        ])
        // Sentinel servers ✅
        // Users in LDV DB
        // AG Planifiées
        // Tickets viewer + Archive
        // Server Users + Archive
        message.channel.send({
            embeds: [GuildDashboard],
            components: [GuildDashboardRow1, GuildDashboardRow2]
        })

        message.delete()
    }
}