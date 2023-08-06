const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class PositionCommand extends BaseCommand {
    constructor () {
        super('position', 'config', [], {
            usage: "position",
            description: "",
            categoryDisplayName: `<:settings:1137410884432564404> Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            home: false,
            subCommands: false
        });
    }

    async run (bot, message, args) {
        console.log(message.channel.position)
    }
}


