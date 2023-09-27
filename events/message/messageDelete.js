const BaseEvent = require('../../utils/structures/BaseEvent');
const Teams = require('../../src/schemas/TeamSchema');

module.exports = class MessageDeleteEvent extends BaseEvent {
    constructor() {
        super('messageDelete')
    }

    async run(client, message) {
        if (!message.guild) return;

        // Check if message is an event message
        if (message.channel.name !== '📌┃organisation') return;

        let parentChannelID = message.channel.parent.id;
        const Team = await Teams.findOne({linkedCategoryId: parentChannelID});

        if (!Team) return;

        // Check if message is an event message
        if (Team.events.find(event => event.messageId === message.id)) {
            Team.events = Team.events.filter(event => event.messageId !== message.id);
            await Team.save();
            this.warn("Event deleted from database because message was deleted by end user")
        }
    }
}