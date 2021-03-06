const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { Permissions } = require('discord.js')
require('dotenv').config()

module.exports = class NukeServerButton extends BaseInteraction {
    constructor() {
        super('buttonRebootBot', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.reply({
            content: `Rebooting Client....`,
            ephemeral: true
        })

        await client.destroy()
        process.exit();
    }
}