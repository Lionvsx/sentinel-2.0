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
            categoryDisplayName: `<:compass:1137390624090374228> Dashboard`,
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
            .setTitle("<:userplus:1137394694972788837> ` DASHBOARD SELECTIONS `")
            .setDescription("Bienvenue sur le dashboard du serveur de selections !")
            .setColor('#2b2d31')
            .setThumbnail('https://cdn.discordapp.com/attachments/624720345919651866/1137401889269493791/compass-3.png')
            .addFields(
                { name: '<:refresh:1137421114096746576> | ` SYNC DB `', value: 'Sync notion and selections server', inline: false },
                { name: '<:checksquare:1137390612543459398> | ` COMMIT SWITCH `', value: "Switch users from LDV Selections to LDV Esport", inline: false },
                { name: '<:userx:1137394869812351006> | ` CLEAN MEMBERS `', value: "Kick switched users from LDV Selections", inline: false },
            )
        const Row1 = createButtonActionRow([
            createEmojiButton('buttonSyncDBSelections', '', 'SECONDARY', '<:refresh:1137421114096746576>'),
            createEmojiButton('buttonCommitSwitch', '', 'SECONDARY', '<:checksquare:1137390612543459398>'),
            createEmojiButton('buttonCleanMembers', '', 'SECONDARY', '<:userx:1137394869812351006>')
        ])
        message.channel.send({
            embeds: [embed],
            components: [Row1]
        });
    }
}