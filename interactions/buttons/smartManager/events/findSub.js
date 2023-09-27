const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const {getTeamMembers} = require("../../../../utils/functions/teamsFunctions");
const {MessageEmbed} = require("discord.js");
const {getNotionPages} = require("../../../../utils/functions/notionFunctions");
const {createMessageActionRow, createEmojiButton} = require("../../../../utils/functions/messageComponents");
const {Modal, TextInputComponent, showModal} = require("discord-modals");
const {modalInteraction} = require("../../../../utils/functions/awaitFunctions");
module.exports = class FindSub extends BaseInteraction {
    constructor() {
        super('findSub', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        let parentCategoryId = interaction.channel.parent.id
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        if (!interaction.member.roles.cache.has('624715536693198888')) return interaction.reply({
            content: '<:x_:1137419292946727042> Vous n\'avez pas la permission pour executer cette commande',
            ephemeral: true
        });

        let event = Team.events.find(event => String(event._id) === buttonArgs[1])
        if (!event) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        if (!Team.game) {
            await interaction.reply({
                content: '<:x_:1137419292946727042> Le jeu de la team n\'est pas configuré',
                ephemeral: true
            });
            return;
        }

        let modal = new Modal()
            .setCustomId('findSubModal')
            .setTitle('Recherche de sub')
            .addComponents(
                new TextInputComponent()
                    .setCustomId('subRole')
                    .setLabel('Quel est le rôle recherché ?')
                    .setPlaceholder('Rôle')
                    .setStyle('SHORT')
                    .setRequired(true),

                new TextInputComponent()
                    .setCustomId('subElo')
                    .setLabel('Quel est l\'élo recherché ?')
                    .setPlaceholder('Elo')
                    .setStyle('SHORT')
                    .setRequired(true),

            )

        await showModal(modal, {
            client: client,
            interaction: interaction,
        })

        let modalResponse = await modalInteraction(interaction, modal.customId)

        let subRole = modalResponse.fields.components[0].components[0].value
        let subElo = modalResponse.fields.components[1].components[0].value

        let sameGameTeams = await Teams.find({game: Team.game, _id: {$ne: Team.id}})


        const teamRole = interaction.guild.roles.cache.get(Team.linkedRoleId)
        const teamSubs = teamRole.members.filter(m => m.roles.cache.has('1138459577734680577'))

        let potentialSubs = teamSubs.map(sub => sub.id)

        for (const sameGameTeam of sameGameTeams) {
            let notionPage = await getNotionPages(sameGameTeam.linkedNotionPageId)
            if (!notionPage) continue;

            let teamMembers = getTeamMembers(notionPage)
            if (teamMembers.length < 1) continue;

            let teamMembersDiscordIds = teamMembers.map(member => member.discordId)
            for (const teamMemberId of teamMembersDiscordIds) {
                if (!potentialSubs.includes(teamMemberId)) {
                    potentialSubs.push(teamMemberId)
                }
            }
        }

        if (potentialSubs.length < 1) return modalResponse.reply({
            content: '<:x_:1137419292946727042> Aucun sub trouvé',
            ephemeral: true
        });

        for (const subId of potentialSubs) {
            let sub = interaction.guild.members.cache.get(subId)
            if (!sub) continue;

            let dmChannel = await sub.createDM()
            await dmChannel.send({
                embeds: [
                    new MessageEmbed()
                        .setColor('#2b2d31')
                        .setTitle('<:triangle:1137394274816753695> ` RECHERCHE DE SUB `')
                        .setDescription(`Bonjour, ${sub.user.username} !\n\nLa team ${Team.name} a besoin d'un sub pour l'évènement ${event.name} qui a lieu dans <t:${event.discordTimestamp}:R>.\nLe poste recherché est \`${subRole}\` et l'élo recherché est \`${subElo}\`\n\nSi tu es disponible, clique sur le bouton ci-dessous pour confirmer ta disponibilité !`)
                ],
                components: [
                    createMessageActionRow([
                        createEmojiButton(`sub|${event.id}|${Team.id}`, "Je suis disponible", "SECONDARY", "<:check:1137387353846063184>")
                    ])
                ]
            })
        }

        await modalResponse.reply({
            content: '<:check:1137387353846063184> J\'ai envoyé un message à `' + potentialSubs.length + '` sub(s) potentiel(s)',
        })
    }
}