const BaseCommand = require('../../utils/structures/BaseCommand')
const {Permissions} = require("discord.js");

module.exports = class SetEmojiParent extends BaseCommand {
    constructor () {
        super('setemoji', 'config', [], {
            usage: "setemoji <emoji>",
            description: "Change l'emoji d'un salon, ou le définit s'il n'existe pas",
            categoryDisplayName: `<:settings:1137410884432564404> Config`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            home: false,
            subCommands: false
        });
    }

    async run (client, message, args) {
        let chanFullName = message.channel.name
        let chanArgs = chanFullName.split('┃')
        if (!chanArgs[1]) {
            message.channel.setName(`${args[1]}┃${chanArgs[0]}`)
        } else {
            message.channel.setName(`${args[1]}┃${chanArgs[1]}`)
        }
    }
}



