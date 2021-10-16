const BaseCommand = require('../../utils/structures/BaseCommand')
const Team = require('../../src/schemas/TeamSchema');
const { Permissions } = require('discord.js');
const mongoose = require('mongoose');
const { askForConfirmation } = require('../../utils/functions/awaitFunctions');

module.exports = class TeamDeleteCommand extends BaseCommand {
    constructor() {
        super('team-delete', 'teams', [], {
            usage: 'team-delete',
            description: 'Supprime une équipe',
            categoryDisplayName: `👥 Teams`,
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: [],
            examples: [],
            serverOnly: true,
            admin: true,
            subCommands: true,
            home: true
        });
    }

    async run(client, message, args) {
        const existingTeam = await Team.findOne({ linkedCategoryId: message.channel.parentId })

        if (existingTeam && existingTeam._id) {
            const loading = client.emojis.cache.get('741276138319380583')
            const confirmation = askForConfirmation(message.channel, `Etes vous sur de vouloir supprimer l'équipe \`${existingTeam.name}\` de la base de données ?`)
            if (!confirmation) return
            const tempMsg = await message.channel.send(`**${loading} | **Suppression de l'équipe en cours...`)
            await mongoose.model('Team').deleteOne({ _id: existingTeam._id })
            tempMsg.edit(`**✅ | **L'équipe \`${existingTeam.name}\` a été supprimée de la base de données !`)
        } else message.channel.send(`**❌ | **Ce channel n'heberge aucune équipe !`)
    }
}