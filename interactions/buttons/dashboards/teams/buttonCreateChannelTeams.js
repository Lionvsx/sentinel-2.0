const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, menuInteraction } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed, Permissions } = require('discord.js')
const { createSelectionMenu, createSelectionMenuOption, createMessageActionRow} = require('../../../../utils/functions/messageComponents')
const { getEmoji, getUsersAndRolesFromString } = require('../../../../utils/functions/utilitaryFunctions')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')
const Teams = require("../../../../src/schemas/TeamSchema");

module.exports = class CreateChannelTeams extends BaseInteraction {
    constructor() {
        super('buttonCreateChannelTeams', 'teams', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        if (!buttonArgs[1]) return

        let parentCategoryId = buttonArgs[1]
        let Team = await Teams.findOne({linkedCategoryId: parentCategoryId})

        if (!Team) return interaction.reply('<:x_:1137419292946727042> Erreur critique de configuration')

        const dmChannel = await interaction.user.createDM()

        const loading = client.emojis.cache.get('741276138319380583')

        await interaction.reply({
            content: '<:check:1137390614296678421> Check tes DMS',
            ephemeral: true
        })

        const channelLogger = new DiscordLogger('channel', '#00cec9')
        channelLogger.setLogMember(interaction.member)
        channelLogger.setGuild(interaction.guild)


        let typeEmbed = new MessageEmbed()
            .setDescription(`<:arrowdown:1137420436016214058> Quel type de channel voulez vous créer? <:arrowdown:1137420436016214058>`)
            .setColor('#2b2d31')

        const selectionMenuComponent = createSelectionMenu('selectionCreateChannelMenu', 'Veuillez sélectionner un type de channel', [
            createSelectionMenuOption('GUILD_TEXT', 'Channel Textuel', undefined, '<:messagecircle:1137423168080973874>'),
            createSelectionMenuOption('GUILD_VOICE', 'Channel Vocal', undefined, '<:headphones:1137423170215886890>'),
            createSelectionMenuOption('GUILD_STAGE_VOICE', 'Channel de Conférence', undefined, '<:users:1137390672194850887>'),
            createSelectionMenuOption('CANCEL', 'Annulez la commande', undefined, '<:x_:1137419292946727042>')
        ], 1, 1)
        const selectionMenuMessage = await dmChannel.send({
            embeds: [typeEmbed],
            components: [createMessageActionRow([selectionMenuComponent])]
        })

        const selectionMenuInteraction = await menuInteraction(selectionMenuMessage).catch(err => console.log(err))
        if (!selectionMenuInteraction) return;

        if (selectionMenuInteraction.values[0] === 'CANCEL') return selectionMenuInteraction.update({
            embeds: [new MessageEmbed().setDescription(`**<:x_:1137419292946727042> | **Commande annulée`)],
            component: []
        })

        selectionMenuInteraction.deferUpdate()

        const channelPermissions = [
            { id: interaction.guild.roles.everyone.id, deny: Permissions.FLAGS.VIEW_CHANNEL },
            { id: interaction.user.id, allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT, Permissions.FLAGS.SEND_MESSAGES] },
            { id: '624715536693198888', allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT, Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.MUTE_MEMBERS, Permissions.FLAGS.MOVE_MEMBERS, Permissions.FLAGS.DEAFEN_MEMBERS] }
        ]

        const channelName = await userResponseContent(dmChannel, `Quel nom voulez vous donner à votre channel ?`).catch(err => console.log(err))
        if (!channelName) return;
        const channelEmoji = await userResponseContent(dmChannel, `Quel emoji voulez vous donner à votre channel ?`).catch(err => console.log(err))
        if (!channelEmoji) return;

        const userAndRolesToAdd = await userResponseContent(dmChannel, "Quels autres utilisateurs ou rôles souhaitez vous rajouter au channel : \`(pseudos discord ou roles séparés d'une virgule, tapez \"aucun\" si il n'y en a aucun)\`").catch(err => console.log(err))
        if (!userAndRolesToAdd) return;

        let audience = undefined
        if (userAndRolesToAdd.toLowerCase() !== 'aucun') {
            audience = await getUsersAndRolesFromString(interaction.guild, userAndRolesToAdd.split(/\s*,\s*/))
            if (audience.length === 0) return dmChannel.send(`**<:x_:1137419292946727042> | **Aucun utilisateur ou rôle valide trouvé !`)
            for (const element of audience) {
                channelPermissions.push({ id: element.id, allow: [Permissions.FLAGS.VIEW_CHANNEL]})
            }
        }

        const permissionSelectorMenu = selectionMenuInteraction.values[0] === 'GUILD_TEXT' ? createSelectionMenu('selectPermissionMenu', 'Veuillez sélectionner un modèle de permissions', [
                createSelectionMenuOption('annonce', 'Channel Annonce', `Seul le Head Staff peut envoyer des messages`, '<:triangle:1137394274816753695>'),
                createSelectionMenuOption('discussion', 'Channel Discussion', `Tout le monde peut parler`, '<:messagecircle:1137423168080973874>'),
                createSelectionMenuOption('interpole', 'Channel Inter-Team', `Seul la team peut parler, pas les rôles/utilisateurs additionnels`, '<:share:1137426868971245630>'),
                createSelectionMenuOption('documents', 'Channel Documents', `Seul vous pouvez parler`, '<:folder:1137426389793001572>'),

            ], 1, 1)
            : selectionMenuInteraction.values[0] === 'GUILD_VOICE' ? createSelectionMenu('selectPermissionMenu', 'Veuillez sélectionner un modèle de permissions', [
                    createSelectionMenuOption('vocal', 'Channel Vocal', `Tout le monde peut parler`, '<:headphones:1137423170215886890>'),
                    createSelectionMenuOption('reunion', 'Channel Réunion', `Seul le staff pourra parler, vous aurez besoin de démute les autres`, '<:triangle:1137394274816753695>'),
                    createSelectionMenuOption('private', 'Channel privé', `Seulement le staff esport pourra se connecter`, '<:lock:1137390640418803782>'),
                ], 1, 1)
                : undefined


        if (permissionSelectorMenu) {
            const permissionSelectorMessage = await dmChannel.send({
                embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> Veuillez sélectionner un type de permission <:arrowdown:1137420436016214058>').setColor('2b2d31')],
                components: [createMessageActionRow([permissionSelectorMenu])]
            })
            const permissionSelectorMenuInteraction = await menuInteraction(permissionSelectorMessage).catch(err => console.log(err))
            if (!permissionSelectorMenuInteraction) return;

            permissionSelectorMenuInteraction.deferUpdate()

            const permOptions = permissionOptions[permissionSelectorMenuInteraction.values[0]]
            channelPermissions.push({ id: Team.linkedRoleId, allow: permOptions.linkedRole.allow, deny: permOptions.linkedRole.deny })
            channelPermissions.push({ id: interaction.guild.roles.everyone.id, allow: permOptions.everyoneRole.allow, deny: permOptions.everyoneRole.deny })
        }

        const emoji = getEmoji(channelEmoji)
        if (!emoji || emoji.length > 2) return dmChannel.send(`**<:x_:1137419292946727042> | **Emoji non valide !`)

        const tempMsg = await dmChannel.send(`**${loading} | **Création du channel en cours ...`)
        const newChannel = await interaction.guild.channels.create(`${emoji}┃${channelName}`, {
            permissionOverwrites: channelPermissions,
            type: selectionMenuInteraction.values[0],
            reason: "Creation de channel par staff esport",
            parent: interaction.guild.channels.cache.get(Team.linkedCategoryId)
        })

        tempMsg.edit(`**<:check:1137390614296678421> | **Channel crée avec succès !`)

        channelLogger.setLogData(`Name: ${newChannel.name}\nCategory: ${newChannel.parent.name}\nType: ${newChannel.type}`)

        channelLogger.info(`<@!${interaction.user.id}> a crée un nouveau channel dans son équipe`)


    }
}

const permissionOptions = {
    annonce: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        }
    },
    discussion: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL]
        }
    },
    interpole: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        }
    },
    documents: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SEND_MESSAGES]
        }
    },
    vocal: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL]
        }
    },
    reunion: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.SPEAK]
        }
    },
    private: {
        linkedRole: {
            allow: [Permissions.FLAGS.VIEW_CHANNEL],
            deny: []
        },
        everyoneRole: {
            allow: [],
            deny: [Permissions.FLAGS.VIEW_CHANNEL, Permissions.FLAGS.CONNECT]
        }
    },
}