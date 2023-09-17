const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const Teams = require('../../../../src/schemas/TeamSchema')
const {
    createMessageActionRow,
    createSelectionMenu, createSelectionMenuOption
} = require("../../../../utils/functions/messageComponents");
const {MessageEmbed} = require("discord.js");
const {menuInteraction} = require("../../../../utils/functions/awaitFunctions");

module.exports = class ButtonAddSub extends BaseInteraction {
    constructor() {
        super('buttonRemoveSub', 'teams', 'button', {
            userPermissions: [],
            clientPermissions: [],
        });
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return

        let parentCategoryId = buttonArgs[1]
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})

        if (!Team) return interaction.reply('<:x_:1137419292946727042> Erreur critique de configuration')

        let dmChannel = await interaction.user.createDM()
        if (!dmChannel) return;

        let subRole = interaction.guild.roles.cache.get('1138459577734680577')

        let allTeamSubs = subRole.members.filter(m => m.roles.cache.has(Team.linkedRoleId))

        if (allTeamSubs.size < 1) return client.replyWarning(interaction, "Il n'y a aucun sub pour cette équipe.")

        await interaction.reply({
            content: '<:check:1137390614296678421> Check tes DMS',
            ephemeral: true
        })

        let subMenuArray = []

        for (const [, member] of allTeamSubs.entries()) {
            subMenuArray.push(createSelectionMenuOption(member.id, member.displayName, undefined, '<:usersub:1139216889231462471>'))
        }

        subMenuArray.push(createSelectionMenuOption('CANCEL', 'Annulez la commande', undefined, '<:x_:1137419292946727042>'))

        // Create select menu with all the subs
        const selectMenu = createMessageActionRow([
            createSelectionMenu(`subMenu`, 'Choisissez un ou plusieurs utilisateurs', subMenuArray, 1, allTeamSubs.size)
        ])

        let embed = new MessageEmbed()
            .setDescription("<:arrowdown:1137420436016214058> Quel sub voulez vous supprimer de l'équipe? <:arrowdown:1137420436016214058>")

        const selectionMenuMessage = await dmChannel.send({
            embeds: [embed],
            components: [selectMenu]
        })

        const selectionMenuInteraction = await menuInteraction(selectionMenuMessage).catch(err => console.log(err))
        if (!selectionMenuInteraction) return;

        if (selectionMenuInteraction.values[0] === 'CANCEL') return selectionMenuInteraction.update({
            embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> | **Commande annulée`)],
            component: []
        })

        selectionMenuInteraction.deferUpdate()

        for (const memberId of selectionMenuInteraction.values) {
            let guildMember = interaction.guild.members.cache.get(memberId)
            await guildMember.roles.remove([Team.linkedRoleId, '1138459577734680577'])
        }

        dmChannel.send('<:check:1137390614296678421> Les membres sélectionnés ont été retirés de votre équipe')
    }
}