const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const {queryDatabaseFilter, deletePage} = require("../../../../utils/functions/notionFunctions");
const {askForConfirmation} = require("../../../../utils/functions/awaitFunctions");
const DiscordLogger = require("../../../../utils/services/discordLoggerService");
const {MessageEmbed} = require("discord.js");
const SelectionUsers = require("../../../../src/schemas/SelectionUserSchema");

module.exports = class ButtonCleanMembers extends BaseInteraction {
    constructor() {
        super('buttonCleanMembers', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        });
    }

    async run(client, interaction, options) {
        await interaction.deferUpdate();
        let filter = {
            or: [
                {
                    property: "Server State",
                    select: {
                        equals: "Switched"
                    }
                },
                {
                    property: "Etat",
                    select: {
                        equals: "Refusé"
                    }
                }
            ]
        }

        let authorDmChannel = await interaction.user.createDM();
        const selectionMembersToKick = await queryDatabaseFilter("fec4ef6d3b204c2b86a4c4cc2855d0e4", filter)

        const confirmation = await askForConfirmation(authorDmChannel, `Voulez vous vraiment kick les membres suivants du serveur LDV Selections ? \n\nWILL BE KICKED:\n\`\`\`${selectionMembersToKick.length > 0 ? selectionMembersToKick.map(notionPage => notionPage.properties["Discord Tag"].title[0].text.content).join('\n'): 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return;

        const loading = client.emojis.cache.get('741276138319380583')

        const ldvGuild = client.guilds.cache.get("227470914114158592")
        const tempMsg = await authorDmChannel.send(`**${loading} | **Début de la procédure d'expulsion des utilisateurs ...`)

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(ldvGuild)

        const success = []
        const errors = []
        const alreadyLeft = []
        let count = 0

        for (const userPage of selectionMembersToKick) {
            const discordTag = userPage.properties["Discord Tag"].title[0].text.content;
            const discordId = userPage.properties["Discord ID"].rich_text[0].text.content;
            const discordMember = interaction.guild.members.cache.get(discordId);
            let SelectionUser = SelectionUsers.findOne({discordId: discordId})
            if (SelectionUser) {
                await SelectionUsers.deleteOne({discordId: discordId})
            }
            if (discordMember) {
                try {
                    await discordMember.kick("Kick automatique des membres de la sélection LDV")
                    await configLogger.info(`Kicked \`${discordTag}\` from LDV Selections`)
                    this.log(`Kicked ${discordTag} (${discordId}) from LDV Selections`)
                    // Delete notion page
                    await deletePage(userPage.id)
                    success.push(discordTag)
                } catch (err) {
                    errors.push(discordTag)
                    await configLogger.error(`Could not kick \`${discordTag}\` : ${err.message}`)
                    this.error(`Could not kick \`${discordTag}\` : ${err.message}`)
                }
            } else {
                await configLogger.info(`Could not kick \`${discordTag}\` : Already left the server`)
                await deletePage(userPage.id)
                this.log(`Could not kick \`${discordTag}\` : Already left the server`)
                alreadyLeft.push(discordTag)
            }
            count++

            let percentage = Math.floor(count / selectionMembersToKick.length * 100)
            let barProgress = Math.floor(percentage / 5)

            if (count % 3 === 0) {
                let bar = renderProgressBar(barProgress, 20)
                let embed = new MessageEmbed()
                    .setDescription(`**${loading} | **Kicking users...\n\`\`\`${bar} ${percentage}% | ${count}/${selectionMembersToKick.length}\`\`\``)
                    .setColor('#2b2d31')
                await tempMsg.edit({
                    embeds: [embed],
                    content: ` `
                })
            }
        }

        await tempMsg.delete()

        const summaryEmbed = new MessageEmbed()
            .setTitle('<:info:1137425479914242178> ` COMPTE RENDU `')
            .setDescription(`Compte rendu final de l'opération d'ajout de membres en tant que membres associatifs :\n\n**<:check:1137390614296678421> UTILISATEURS EXPULSÉS**\n\`\`\`${success.length > 0 ? success.join('\n'): 'Aucun'}\`\`\``)
            .addField('<:minuscircle:1137390648262135951> UTILISATEURS AYANT DEJA QUITTÉ', `\`\`\`${alreadyLeft.length > 0 ? alreadyLeft.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`<:x_:1137419292946727042> ERREURS`, `\`\`\`${errors.length > 0 ? errors.join(',\n') : 'Aucune'}\`\`\``, false)
            .setColor('#2b2d31')

        await authorDmChannel.send({
            embeds: [summaryEmbed]
            })
    }
}

function renderProgressBar(progress, size) {
    let bar = "";
    for (let i = 0; i < progress; i++) {
        bar += "█"
    }
    for (let i = 0; i < size - progress; i++) {
        bar += "▁"
    }
    return bar;
}