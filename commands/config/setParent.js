const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class SetParent extends BaseCommand {
    constructor () {
        super('setparent', 'config', [], {
            usage: "setparent <category id>",
            description: "Definit la catégorie d'un channel",
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

    async run (client, message, args) {
        await message.channel.setParent(args[1])
        await message.delete()
    }
}



