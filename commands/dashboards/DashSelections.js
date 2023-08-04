const BaseCommand = require('../../utils/structures/BaseCommand')
const {
    createButtonActionRow,
    createEmojiButton
} = require('../../utils/functions/messageComponents')
const {Permissions, MessageEmbed} = require("discord.js");

module.exports = class DashBureauCommand extends BaseCommand {
    constructor () {
        super('dashboardselections', 'dashboard', [], {
            usage: "dashboardselections",
            description: "Crée un dashboard pour le serveur de selections",
            categoryDisplayName: `🧭 Dashboard`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            examples: [],
            serverOnly: true,
            admin: true,
            home: false,
            subCommands: false
        });
    }

    async run (bot, message, args) {
        const embed = new MessageEmbed()
            .setTitle("DASHBOARD SELECTIONS")
            .setDescription("Bienvenue sur le dashboard du serveur de selections !")
            .setColor("#0099ff")
            .setThumbnail("https://cdn.discordapp.com/attachments/624619133799104522/742037500536684574/icon_dashboard.png")
            .addFields(
                { name: '\u200B', value: '\u200B' },
                { name: '↩️ | SYNC DB', value: 'Sync notion and selections server', inline: true },
                { name: '✅ | COMMIT SWITCH', value: "Switch users from LDV Selections to LDV Esport", inline: true },
                { name: '📳 | CLEAN MEMBERS', value: "Kick switched users from LDV Selections", inline: true },
            )
        const Row1 = createButtonActionRow([
            createEmojiButton('buttonSyncDBSelections', 'Sync Database', 'PRIMARY', '↩️'),
            createEmojiButton('buttonCommitSwitch', 'Commit Switch', 'SUCCESS', '✅'),
            createEmojiButton('buttonCleanMembers', 'Clean Members', 'DANGER', '📳')
        ])
        message.channel.send({
            embeds: [embed],
            components: [Row1]
        });
    }
}