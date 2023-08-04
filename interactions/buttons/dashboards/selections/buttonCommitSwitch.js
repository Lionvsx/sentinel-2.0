const BaseInteraction = require('../../../../utils/structures/BaseInteraction');
const {queryDatabaseFilter, updateSelectionUser, getNotionPage,
    selectionUserSwitch
} = require("../../../../utils/functions/notionFunctions");
const {updateGuildMemberCache} = require("../../../../utils/functions/utilitaryFunctions");
const User = require("../../../../src/schemas/UserSchema");
const { onlyUnique } = require("../../../../utils/functions/utilitaryFunctions");
const {isMember} = require("../../../../utils/functions/dbFunctions");
const {
    createButtonActionRow,
    createButton
} = require("../../../../utils/functions/messageComponents");
const {MessageEmbed} = require("discord.js");
const DiscordLogger = require("../../../../utils/services/discordLoggerService");
const {askForConfirmation} = require("../../../../utils/functions/awaitFunctions");

const poleIds = {
    "Web TV" : "622108579792683010",
    "Direction Artistique" :  "622108762416611329",
    "Communication" :  "622109740637487130",
    "Event" : "622109829150015498",
    "Esport" : "624715536693198888",
    "Partenariat" : "894735081254551583",
    "Coach": "622108099569909762",
    "Manager": "622108209175593020",
    "Joueur": "744234937535955045",
}

module.exports = class ButtonCommitSwitch extends BaseInteraction {
    constructor() {
        super('buttonCommitSwitch', 'buttons', 'button', {
            userPermissions: [],
            clientPermissions: []
        });
    }

    async run(client, interaction, args) {
        await interaction.deferUpdate();
        let filter = {
            property: "Server State",
            select: {
                equals: "Ready to commit"
            }
        }

        let authorDmChannel = await interaction.user.createDM();
        const selectionMembersToCommit = await queryDatabaseFilter("fec4ef6d3b204c2b86a4c4cc2855d0e4", filter)

        const confirmation = await askForConfirmation(authorDmChannel, `Voulez vous vraiment switch les membres suivants sur le serveur LDV Esport ? \n\nNEXT COMMIT:\n\`\`\`${selectionMembersToCommit.length > 0 ? selectionMembersToCommit.map(notionPage => notionPage.properties["Discord Tag"].title[0].text.content).join('\n'): 'Aucun'}\`\`\``).catch(err => console.log(err))
        if (!confirmation) return;

        const loading = client.emojis.cache.get('741276138319380583')

        const tempMsg = await authorDmChannel.send(`**${loading} | **Début de la procédure d'ajout des utilisateurs ...`)

        const ldvGuild = client.guilds.cache.get("227470914114158592")
        const ldvGuildMembers = await updateGuildMemberCache(ldvGuild)
        const allRoles = ldvGuild.roles.cache

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)

        const success = []
        const errors = []
        const presence = []


        for (const userPage of selectionMembersToCommit) {
            const ldvMember = ldvGuildMembers.get(userPage.properties["Discord ID"].rich_text[0].text.content)
            if (!ldvMember) {
                await updateSelectionUser(userPage.id, {
                    serverState: "Not on server"
                })
                continue;
            }

            let rolesToAdd = []

            let poles = userPage.properties["Pôles"].multi_select

            let roles = []
            for (const pole of poles) {
                switch (pole.name) {
                    case "Bureau":
                        roles.push("Bureau")
                        break;
                    case "Head Staff":
                        roles.push("Head Staff")
                        break;
                    case "Manager":
                        roles.push("Manager")
                        let managerRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (managerRoles.size > 0) rolesToAdd = rolesToAdd.concat(managerRoles.map(role => role.id))
                        break;
                    case "Coach":
                        roles.push("Coach")
                        let coachRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (coachRoles.size > 0) rolesToAdd = rolesToAdd.concat(coachRoles.map(role => role.id))
                        break;
                    case "Joueur":
                        roles.push("Joueur")
                        let playerRoles = allRoles.filter(role => role.id === '744234937535955045' && !ldvMember.roles.cache.has(role.id))
                        if (playerRoles.size > 0) rolesToAdd = rolesToAdd.concat(playerRoles.map(role => role.id))
                        break;
                    case "Communication":
                        roles.push("Communication")
                        let communicationRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (communicationRoles.size > 0) rolesToAdd = rolesToAdd.concat(communicationRoles.map(role => role.id))
                        break;
                    case "Esport":
                        roles.push("Esport")
                        let esportRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (esportRoles.size > 0) rolesToAdd = rolesToAdd.concat(esportRoles.map(role => role.id))
                        break;
                    case "Event":
                        roles.push("Event")
                        let eventRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (eventRoles.size > 0) rolesToAdd = rolesToAdd.concat(eventRoles.map(role => role.id))
                        break;
                    case "Direction Artistique":
                        roles.push("Direction Artistique")
                        let daRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (daRoles.size > 0) rolesToAdd = rolesToAdd.concat(daRoles.map(role => role.id))
                        break;
                    case "Partenariat":
                        roles.push("Partenariat")
                        let partenariatRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (partenariatRoles.size > 0) rolesToAdd = rolesToAdd.concat(partenariatRoles.map(role => role.id))
                        break;
                    case "Web TV":
                        roles.push("Web TV")
                        let webtvRoles = allRoles.filter(role => (role.id === '679423033844432917' || role.id === '742006587597651990' || role.id === poleIds[pole.name]) && !ldvMember.roles.cache.has(role.id))
                        if (webtvRoles.size > 0) rolesToAdd = rolesToAdd.concat(webtvRoles.map(role => role.id))
                        break;
                    default:
                        break;
                }
            }


            let games = userPage.properties["Jeu"].multi_select
            for (const game of games) {
                switch (game.name) {
                    case "League of Legends":
                        let lolRole = allRoles.find(role => role.name.toLowerCase().includes("league of legends") && !ldvMember.roles.cache.has(role.id))
                        if (lolRole) rolesToAdd.push(lolRole.id)
                        break;
                    case "Valorant":
                        let valorantRole = allRoles.find(role => role.name.toLowerCase().includes("valorant") && !ldvMember.roles.cache.has(role.id))
                        if (valorantRole) rolesToAdd.push(valorantRole.id)
                        break;
                    case "Overwatch":
                        let overwatchRole = allRoles.find(role => role.name.toLowerCase().includes("overwatch") && !ldvMember.roles.cache.has(role.id))
                        if (overwatchRole) rolesToAdd.push(overwatchRole.id)
                        break;
                    case "Rocket League":
                        let rocketLeagueRole = allRoles.find(role => role.name.toLowerCase().includes("rocket league") && !ldvMember.roles.cache.has(role.id))
                        if (rocketLeagueRole) rolesToAdd.push(rocketLeagueRole.id)
                        break;
                    case "R6":
                        let r6Role = allRoles.find(role => role.name.toLowerCase().includes("rainbow 6") && !ldvMember.roles.cache.has(role.id))
                        if (r6Role) rolesToAdd.push(r6Role.id)
                        break;
                    case "Hearthstone":
                        let hearthstoneRole = allRoles.find(role => role.name.toLowerCase().includes("hearthstone") && !ldvMember.roles.cache.has(role.id))
                        if (hearthstoneRole) rolesToAdd.push(hearthstoneRole.id)
                        break;
                    case "CS:GO":
                        let csgoRole = allRoles.find(role => role.name.toLowerCase().includes("csgo") && !ldvMember.roles.cache.has(role.id))
                        if (csgoRole) rolesToAdd.push(csgoRole.id)
                        break;
                    case "Trackmania":
                        let trackmaniaRole = allRoles.find(role => role.name.toLowerCase().includes("trackmania") && !ldvMember.roles.cache.has(role.id))
                        if (trackmaniaRole) rolesToAdd.push(trackmaniaRole.id)
                        break;
                    case "TFT":
                        let tftRole = allRoles.find(role => role.name.toLowerCase().includes("tft") && !ldvMember.roles.cache.has(role.id))
                        if (tftRole) rolesToAdd.push(tftRole.id)
                        break;
                    case "Pokemon":
                        let pokemonRole = allRoles.find(role => role.name.toLowerCase().includes("pokemon") && !ldvMember.roles.cache.has(role.id))
                        if (pokemonRole) rolesToAdd.push(pokemonRole.id)
                        break;
                    case "SSBU":
                        let ssbuRole = allRoles.find(role => role.name.toLowerCase().includes("ssbu") && !ldvMember.roles.cache.has(role.id))
                        if (ssbuRole) rolesToAdd.push(ssbuRole.id)
                        break;
                    default:
                        break;
                }
            }
            rolesToAdd = rolesToAdd.filter(onlyUnique)

            const dmChannel = await ldvMember.createDM()

            const dBUser = await User.findOne({ discordId: ldvMember.user.id });

            if (dBUser && dBUser.id && isMember(dBUser)) {
                presence.push(ldvMember.user.tag)
                continue;
            }

            const componentRow = createButtonActionRow([
                createButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SUCCESS')
            ])
            const embed = new MessageEmbed()
                .setTitle(`**BIENVENUE CHEZ LDV ESPORT**`)
                .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurions besoin de quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
                .setColor('#00b894')
            try {
                await dmChannel.send({
                    embeds: [embed],
                    components: [componentRow]
                })
                if (dBUser && dBUser.id) {
                    dBUser.isMember = true;
                    dBUser.roles = roles
                    await dBUser.save();
                } else {
                    await User.create({
                        username: ldvMember.user.username,
                        discordId: ldvMember.user.id,
                        userTag: ldvMember.user.tag,
                        avatarURL: ldvMember.user.displayAvatarURL(),
                        onServer: true,
                        isMember: true
                    })
                }
                success.push(ldvMember.user.tag)
                this.log(`Sent DM to ${ldvMember.user.tag}`)
                await tempMsg.edit(`**${loading} | **Ajout des utilisateurs en cours à la DB : \`${success.length + errors.length + presence.length}/${selectionMembersToCommit.length}\``)
            } catch (err) {
                errors.push(ldvMember.user.tag)
            }


            await ldvMember.roles.add(rolesToAdd)

            await selectionUserSwitch(userPage.id)
        }

        if (success.length + errors.length + presence.length === selectionMembersToCommit.length) {
            await tempMsg.edit(`**✅ | **Ajout des utilisateurs terminé`)
        }

        const summaryEmbed = new MessageEmbed()
            .setTitle('COMPTE RENDU')
            .setDescription(`Compte rendu final de l'opération d'ajout de membres en tant que membres associatifs :\n*(Vous pouvez recopier les champs d'erreur pour les re-envoyer au bot lors d'une prochaine commande)*\n\n**✅ UTILISATEURS AJOUTES**\n\`\`\`${success.length > 0 ? success.join('\n'): 'Aucun'}\`\`\``)
            .addField('ℹ UTILISATEURS DEJA ENREGISTRES', `\`\`\`${presence.length > 0 ? presence.join('\n'): 'Aucun'}\`\`\``, false)
            .addField(`✉ UTILISATEURS INJOIGNABLES EN DM`, `\`\`\`${errors.length > 0 ? errors.join(',\n') : 'Aucun'}\`\`\``, false)
            .setColor('#fdcb6e')

        await authorDmChannel.send({
            embeds: [summaryEmbed]
        })
    }
}