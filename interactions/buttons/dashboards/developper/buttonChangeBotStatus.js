const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const {Permissions} = require("discord.js");
const {userResponseContent} = require("../../../../utils/functions/awaitFunctions");

module.exports = class ButtonChangeBotStatus extends BaseInteraction {
    constructor() {
        super('buttonChangeBotStatus', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate();
        // Open DM with user to ask for the new status
        const dmChannel = await interaction.user.createDM();

        let statusMessage = await userResponseContent(dmChannel, `Quel message voulez vous que le bot affiche ?`).catch(() => this.log('user response timeout'));
        if (!statusMessage) return;

        let activityType = await userResponseContent(dmChannel, `Quel type d'activité voulez vous que le bot affiche ? (PLAYING, STREAMING, LISTENING, WATCHING)`).catch(() => this.log('user response timeout'));
        if (!activityType) return;

        // Set the new status
        client.user.setActivity(statusMessage, {type: activityType.toUpperCase()});

        // Send confirmation message
        await dmChannel.send(`<:check:1137390614296678421> Le status du bot a bien été changé !`);
    }
}