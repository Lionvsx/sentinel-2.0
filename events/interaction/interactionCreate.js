const BaseEvent = require('../../utils/structures/BaseEvent');
const mongoose = require('mongoose')

module.exports = class InteractionCreateEvent extends BaseEvent {
    constructor() {
        super('interactionCreate')
    }

    async run(client, interaction) {
        console.log(interaction);
    }
}