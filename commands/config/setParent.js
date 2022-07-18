const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class SetParent extends BaseCommand {
    constructor () {
        super('setparent', 'config', [], {
            usage: "setparent <category id>",
            description: "Definit la catégorie d'un channel",
            categoryDisplayName: `⚙️ Config`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            hide: false,
            admin: true,
            home: false
        });
    }

    async run (client, message, args) {
        await message.channel.setParent(args[1])
        await message.delete()
    }
}



