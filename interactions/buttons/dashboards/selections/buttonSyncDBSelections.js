const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { MessageEmbed, Permissions } = require('discord.js')
const { updateGuildMemberCache, sleep} = require('../../../../utils/functions/utilitaryFunctions')
const {createSelectionUser, updateSelectionUser, getNotionPage} = require("../../../../utils/functions/notionFunctions");
const {isMember} = require("../../../../utils/functions/dbFunctions");
const Users = require("../../../../src/schemas/UserSchema");
const SelectionUser = require("../../../../src/schemas/SelectionUserSchema");

module.exports = class SyncDatabaseButton extends BaseInteraction {
    constructor() {
        super('buttonSyncDBSelections', 'dashboards', 'button', {
            userPermissions: [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        await interaction.deferUpdate()

        const loading = client.emojis.cache.get('741276138319380583')

        const cachedMembers = await updateGuildMemberCache(interaction.guild)
        const allMembers = cachedMembers.filter(member => !member.user.bot)
        const ldvGuild = client.guilds.cache.get('227470914114158592')
        const ldvGuildMembers = await updateGuildMemberCache(ldvGuild)

        const dmChannel = await interaction.user.createDM()
        let msg = await dmChannel.send(`**${loading} | **Syncing DB...`)

        let count = 0;

        for (const [, member] of allMembers) {
            let accepted = member.roles.cache.has("676720835393880075")
            let rejected = member.roles.cache.has("676720836853366784")
            let ldvMember = ldvGuildMembers.get(member.user.id)

            let dbUser = await Users.findOne({discordId: member.user.id})

            let isLDVMember = dbUser ? isMember(dbUser) : false

            let user = await SelectionUser.findOne({discordId: member.user.id})

            let tryoutRoles = member.roles.cache.filter(r => r.name.toLowerCase().includes('tryout'))

            let jeux = []
            let poles = []

            if (member.roles.cache.has("754421243268300851")) poles.push({name: "Head Staff"})

            for (const [, toRole] of tryoutRoles) {
                let roleSeparator = toRole.name.split('| ')
                let toRoleArgs = roleSeparator[1].split(' ')
                switch(toRoleArgs[1].toLowerCase()) {
                    case 'lol':
                        jeux.push({
                            "name": "League of Legends"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'valo':
                        jeux.push({
                            "name": "Valorant"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'csgo':
                        jeux.push({
                            "name": "CS:GO"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'ow':
                        jeux.push({
                            "name": "Overwatch"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'rl':
                        jeux.push({
                            "name": "Rocket League"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'hs':
                        jeux.push({
                            "name": "Hearthstone"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'tft':
                        jeux.push({
                            "name": "TFT"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'pkm':
                        jeux.push({
                            "name": "Pokemon"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'r6':
                        jeux.push({
                            "name": "R6"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'tm':
                        jeux.push({
                            "name": "Trackmania"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'ssbu':
                        jeux.push({
                            "name": "SSBU"
                        })
                        poles.push({
                            "name": "Joueur"
                        })
                        break;
                    case 'com':
                        poles.push({
                            "name": "Communication"
                        })
                        break;
                    case 'manager':
                        poles.push({
                            "name": "Manager"
                        },
                        {
                            "name": "Esport"
                        })
                        break;
                    case "coach":
                        poles.push({
                            "name": "Coach"
                        },
                        {
                            "name": "Esport"
                        })
                        break;
                    case "webtv":
                        poles.push({
                            "name": "Web TV"
                        })
                        break;
                    case "da":
                        poles.push({
                            "name": "Direction Artistique"
                        })
                        break;
                    case "partenariat":
                        poles.push({
                            "name": "Partenariat"
                        })
                        break;
                    case "event":
                        poles.push({
                            "name": "Event"
                        })
                        break;
                    default:
                        poles.push({
                            "name": "Error"
                        })
                }
            }
            if (user && user.isOnNotion) {
                let filter = {
                        property: 'Discord ID',
                        formula: {
                            string: {
                                equals: member.user.id,
                            }
                        }
                    }
                let notionPage = await getNotionPage("fec4ef6d3b204c2b86a4c4cc2855d0e4", filter)
                if (!notionPage) {
                    user.isOnNotion = false
                    user.linkedNotionPageId = undefined
                    await user.save()
                    continue;
                }
                let pageId = notionPage.id
                if (!user.linkedNotionPageId) {
                    user.linkedNotionPageId = pageId
                    await user.save()


                }

                if (notionPage.properties['Server State'].select.name === "Switched") continue;

                let serverState = !ldvMember ? "Not on server" : "On server"
                if (isLDVMember) serverState = "Switched"
                else if (notionPage.properties['Etat'].select.name === 'Accepté' && serverState === 'On server') serverState = "Ready to commit"
                if (notionPage.properties['Etat'].select.name === 'Accepté' && !ldvMember) {
                    await this.inviteUserToServer(member)
                    serverState = "Invited"
                }
                await updateSelectionUser(pageId, {
                    avatarURL: member.user.displayAvatarURL(),
                    discordTag: member.user.tag,
                    state: accepted ? "Accepté" : rejected ? "Refusé" : notionPage.properties['Etat'].select.name,
                    serverState: serverState,
                    jeux: notionPage.properties['Etat'].select.name === 'Accepté' ? notionPage.properties['Jeu'].multi_select : jeux,
                    poles: notionPage.properties['Etat'].select.name === 'Accepté' ? notionPage.properties['Pôles'].multi_select : poles,
                })
                this.log(`Updated Notion user ${member.user.tag}`)
                await sleep(200)
                count++
            } else {
                let page = await createSelectionUser({
                    avatarURL: member.user.displayAvatarURL(),
                    discordId: member.user.id,
                    discordTag: member.user.tag,
                    state: accepted ? "Accepté" : rejected ? "Refusé" : "En attente",
                    serverState: !ldvMember ? "Not on server" : isLDVMember ? "Switched" : accepted ? "Ready to commit" : "On server",
                    jeux: jeux,
                    poles: poles
                })
                this.log(`Created Notion user ${member.user.tag}`)
                if (user) {
                    user.userTag = member.user.tag
                    user.avatarURL = member.user.displayAvatarURL()
                    user.isOnNotion = true
                    user.linkedNotionPageId = page.id
                    await user.save()
                } else {
                    await SelectionUser.create({
                        discordId: member.user.id,
                        isOnNotion: true,
                        userTag: member.user.tag,
                        avatarURL: member.user.displayAvatarURL()
                    })
                }
                await sleep(200)
                count++
            }

            let percentage = Math.floor(count / allMembers.size * 100)
            let barProgress = Math.floor(percentage / 5)

            if (count % 3 === 0) {
                let bar = renderProgressBar(barProgress, 20)
                let embed = new MessageEmbed()
                    .setDescription(`**${loading} | **Syncing with notion...\n\`\`\`${bar} ${percentage}% | ${count}/${allMembers.size}\`\`\``)
                    .setColor('#2b2d31')
                await msg.edit({
                    embeds: [embed],
                    content: ` `
                })
            }
        }

        await msg.delete()
        let embed = new MessageEmbed()
            .setColor('#2b2d31')
            .setDescription(`**<:check:1137390614296678421> | **Members synced !`)
        await dmChannel.send({
            embeds: [embed]
        })

    }

    async inviteUserToServer(member) {
        let dmChannel = await member.createDM()
        if (!dmChannel) this.error(`Could not create DM channel with ${member.user.tag}`)
        let embed = new MessageEmbed()
            .setColor('#2b2d31')
            .setTitle(`\` Invitation au serveur LDV Esport ! \``)
            .setDescription(`Bonjour \`${member.user.username}\` !\n\nJe suis LDV Sentinel, le bot en charge de gérer tous les serveurs en relation avec LDV Esport !\nJ'ai remarqué que tu a été accepté chez LDV le semestre prochain mais tu n'es pas sur le serveur LDV !\nJe t'invite donc à rejoindre notre serveur Discord !\nPour cela, clique sur le lien suivant : https://discord.gg/ldvesport\n\nA bientôt !`)
        await dmChannel.send({
            embeds: [embed]
        })
        this.log(`Sent invitation to ${member.user.tag}`)
    }
}

function renderProgressBar(progress, size) {
    let bar = "";
    for (let i = 0; i < progress; i++) {
        bar += "█"
    }
    for (let i = 0; i < size - progress; i++) {
        bar += "▁"
    }
    return bar;
}
