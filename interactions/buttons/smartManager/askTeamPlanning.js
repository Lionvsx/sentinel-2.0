const BaseInteraction = require('../../../utils/structures/BaseInteraction');
const Teams = require("../../../src/schemas/TeamSchema");
const {getNotionPageById} = require("../../../utils/functions/notionFunctions");
const {getTeamMembers} = require("../../../utils/functions/teamsFunctions");
const {MessageEmbed} = require("discord.js");


module.exports = class AskTeamPlanning extends BaseInteraction {
    constructor() {
        super('askTeamPlanning', 'smartManager', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        const Team = await Teams.findOne({linkedCategoryId: buttonArgs[1]});
        if (!Team) return interaction.reply({
            content: '<:x_:1137419292946727042> Erreur critique de configuration',
            ephemeral: true
        });

        if (Team.availabilitiesAnswered >= Team.minPlayers) {
            interaction.reply({
                content: '<:info:1137425479914242178> Les joueurs ont déjà rempli leurs disponibilités pour cette semaine',
                ephemeral: true
            });
            return
        }

        interaction.deferReply({
            ephemeral: true
        })

        let notionTeam = await getNotionPageById(Team.linkedNotionPageId)

        let players = await getTeamMembers(notionTeam)

        for (const playerId of players) {
            let playerDiscord = await interaction.guild.members.fetch(playerId)
            let playerDM = await playerDiscord.createDM()

            if (Team.playersAnswered.includes(playerId)) continue

            await playerDM.send({
                embeds: [
                    new MessageEmbed()
                        .setDescription(`<:calendar:1137424147056689293> Rappel: il est temps de remplir tes disponibilités pour la semaine prochaine !`)
                        .setColor('#2b2d31')
                ]
            })
        }

        let playersNotAnswered = players.filter(player => !Team.playersAnswered.includes(player))

        interaction.editReply({
            content: '<:check:1137387353846063184> Les joueurs n\'ayant pas encore répondu ont été notifiés: \n' + playersNotAnswered.map(player => `<@!${player}>`).join('\n'),
            ephemeral: true
        })
    }
}