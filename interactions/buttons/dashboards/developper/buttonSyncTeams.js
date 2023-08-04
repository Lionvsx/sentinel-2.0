const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
const {queryDatabase} = require("../../../../utils/functions/notionFunctions");

module.exports = class ButtonSyncTeams extends BaseInteraction {
    constructor() {
        super('buttonSyncTeams', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.reply({
            content: `Syncing Teams....`,
            ephemeral: true
        })

        const allTeams = await queryDatabase("4aa80d016d124eb991a8ba660e25a062")

        for (const team of allTeams) {
            let teamId = team.id
        }


    }
}

async function syncTeam(notionPageId, categoryId, guild) {

}