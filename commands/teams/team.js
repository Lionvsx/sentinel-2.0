const BaseCommand = require('../../utils/structures/BaseCommand')

module.exports = class TeamCommand extends BaseCommand {
    constructor() {
        super('team', 'teams', [], {
            usage: 'team <commands>',
            description: 'Commandes à lancer dans des canaux d\'équipe',
            categoryDisplayName: `<:users:1137390672194850887> Teams`,
            userPermissions: [],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            subCommands: true,
            home: true,
            arguments: `\`commands\` : set, delete`,
        });
    }

    async run(client, message, args) {
        message.channel.send(`**<:x_:1137419292946727042> | **Arguments invalides ! \`\`${client.config.get(message.guild.id).prefix}help team\`\` pour voir les arguments disponibles !`)
    }
}