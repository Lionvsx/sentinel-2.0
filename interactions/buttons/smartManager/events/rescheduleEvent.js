const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const Teams = require("../../../../src/schemas/TeamSchema");
const SmartAIRescheduler = require("../../../../ai/SmartAIRescheduler");
const {editEvent} = require("../../../../utils/functions/teamsFunctions");
module.exports = class RescheduleEvent extends BaseInteraction {
    constructor() {
        super('rescheduleEvent', 'smartManager', 'button', {
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

        await interaction.deferReply({
            ephemeral: true
        })


        const SmartRescheduler = new SmartAIRescheduler(client)
        let response = await SmartRescheduler.rescheduleEvent(client, Team, event.id)

        if (response.finish_reason === "function_call") {
            console.log(response.message.function_call)
            let args = JSON.parse(response.message.function_call.arguments)
            let cancelEventResponse = await editEvent(interaction.guild, Team, args)
            let functionResponse = await SmartRescheduler.functionInput(cancelEventResponse, 'edit-event')
            await interaction.editReply({
                content: functionResponse.message.content,
                ephemeral: true
            })
        } else {
            await interaction.editReply({
                content: response.message.content,
                ephemeral: true
            })
        }
    }
}