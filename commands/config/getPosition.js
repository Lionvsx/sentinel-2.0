const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class PositionCommand extends BaseCommand {
    constructor () {
        super('position', 'config', [], {
            usage: "position",
            description: "",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            hide: true,
            admin: true,
            home: false
        });
    }

    async run (bot, message, args) {
        console.log(message.channel.position)
    }
}


