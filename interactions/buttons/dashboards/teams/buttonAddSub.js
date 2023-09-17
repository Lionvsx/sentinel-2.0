const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const Teams = require('../../../../src/schemas/TeamSchema')
const {userResponseContent} = require("../../../../utils/functions/awaitFunctions");

module.exports = class ButtonAddSub extends BaseInteraction {
    constructor() {
        super('buttonAddSub', 'teams', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return

        let parentCategoryId = buttonArgs[1]
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})

        if (!Team) return interaction.reply('<:x_:1137419292946727042> Erreur critique de configuration')
        await interaction.reply({
            content: '<:check:1137390614296678421> Check tes DMS',
            ephemeral: true
        })

        let dmChannel = await interaction.user.createDM()
        if (!dmChannel) return;

        let targetUser = await userResponseContent(dmChannel, "Quelle personne voulez vous rajouter en tant que sub?").catch(() => console.log("User response timeout"))
        if (!targetUser) return

        let guildMember = await interaction.guild.members.cache.find(m => m.user.username.toLowerCase().includes(targetUser.toLowerCase()))
        if (guildMember) {
            await guildMember.roles.add([Team.linkedRoleId, '1138459577734680577'])
            dmChannel.send("<:check:1137390614296678421> Utilisateur ajouté en tant que sub : ` " + guildMember.displayName + " `")
        } else {
            return dmChannel.send('<:x_:1137419292946727042> Utilisateur introuvable')
        }

    }
}