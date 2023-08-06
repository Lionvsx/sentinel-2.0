const BaseInteraction = require('../../../../utils/structures/BaseInteraction')
const { userResponseContent, reactionEmbedSelector, menuInteraction, selectorReply } = require('../../../../utils/functions/awaitFunctions')
const { MessageEmbed } = require('discord.js')

const mongoose = require('mongoose')
const { updateGuildMemberCache } = require('../../../../utils/functions/utilitaryFunctions')
const { createButton, createMessageActionRow, createSelectionMenu, createSelectionMenuOption, createButtonActionRow, createEmojiButton } = require('../../../../utils/functions/messageComponents')

const DiscordLogger = require('../../../../utils/services/discordLoggerService')
const {isMember} = require("../../../../utils/functions/dbFunctions");

module.exports = class ManageRespoButtonInteraction extends BaseInteraction {
    constructor() {
        super('buttonManageRespo', 'dashboards', 'button', {
            userPermissions: [],
            clientPermissions: []
        })
    }

    async run(client, interaction, buttonArgs) {
        interaction.deferUpdate()

        const Responsables = await mongoose.model('User').find({ onServer: true, isResponsable: true })
        const dmChannel = await interaction.user.createDM()
        const allMembers = await updateGuildMemberCache(interaction.guild)
        const allRoles = interaction.guild.roles.cache

        const configLogger = new DiscordLogger('config', '#e17055')
        configLogger.setLogMember(interaction.member)
        configLogger.setGuild(interaction.guild)


        let lengthDiv = 25
        const selectionEmbed = new MessageEmbed()
            .setTitle('TABLEAU DE BORD DES REPONSABLES')
            .setDescription(`Responsables actuellement enregistrés dans la base de données : \n\`\`\`asciidoc\n${Responsables.length > 0 ? Responsables.map(respo => `${respo.userTag}${Array(lengthDiv - respo.username.length).fill(' ').join('')}::  ${respo.roleResponsable.toUpperCase()}`).join('\n') : 'Aucun'}\`\`\``)
            .addFields([
                { name: '<:check:1137390614296678421>', value: "Ajouter un membre en tant que responsable", inline: true },
                { name: '<:x_:1137419292946727042>', value: "Retirer un membre du poste de responsable", inline: true },
            ])
            .setColor('2b2d31')
        const manageSelection = await reactionEmbedSelector(dmChannel, ['<:check:1137390614296678421>', '<:x_:1137419292946727042>'], selectionEmbed).catch(err  => console.log(err))
        if (!manageSelection) return;

        if (manageSelection.customId === '<:check:1137390614296678421>') {
            selectorReply(manageSelection, '<:check:1137390614296678421>', 'Ajouter un membre en tant que responsable')
            const stringInputUser = await userResponseContent(dmChannel, "Quel utilisateur souhaitez vous ajouter en tant que responsable ?").catch(err => console.log(err))
            if (!stringInputUser) return

            let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(stringInputUser.toLowerCase()));

            if (!guildMember) return dmChannel.send(`**<:x_:1137419292946727042> | **Utilisateur introuvable !`)

            const ResponsableWebTV = await mongoose.model('User').findOne({ roleResponsable: 'webtv' })
            const ResponsableDA = await mongoose.model('User').findOne({ roleResponsable: 'da' })
            const ResponsableCOM = await mongoose.model('User').findOne({ roleResponsable: 'com' })
            const ResponsableEVENT = await mongoose.model('User').findOne({ roleResponsable: 'event' })
            const ResponsableESPORT = await mongoose.model('User').findOne({ roleResponsable: 'esport' })
            const ResponsablePARTENARIAT = await mongoose.model('User').findOne({ roleResponsable: 'partenariat' })

            const ResponsableWebTVString = ResponsableWebTV?.id ? `Remplacer ${ResponsableWebTV.username} par ${stringInputUser} ?` : "Aucun responsable défini pour la Web TV"
            const ResponsableDAString = ResponsableDA?.id ? `Remplacer ${ResponsableDA.username} par ${stringInputUser} ?` : "Aucun responsable défini pour la Direction Artistique"
            const ResponsableCOMString = ResponsableCOM?.id ? `Remplacer ${ResponsableCOM.username} par ${stringInputUser} ?` : "Aucun responsable défini pour la Communication"
            const ResponsableEVENTString = ResponsableEVENT?.id ? `Remplacer ${ResponsableEVENT.username} par ${stringInputUser} ?` : "Aucun responsable défini pour l'Event"
            const ResponsableESPORTString = ResponsableESPORT?.id ? `Remplacer ${ResponsableESPORT.username} par ${stringInputUser} ?` : "Aucun responsable défini pour l'Esport"
            const ResponsablePARTENARIATString = ResponsablePARTENARIAT?.id ? `Remplacer ${ResponsablePARTENARIAT.username} par ${stringInputUser} ?` : "Aucun responsable défini pour les Partenariats"

            const respoOptionsArray = [
                createSelectionMenuOption('webtv', 'Web TV', ResponsableWebTVString, '<:video:1137424148352737310>'),
                createSelectionMenuOption('da', 'Direction Artistique', ResponsableDAString, '<:bookmark:1137437120139640842>'),
                createSelectionMenuOption('com', 'Communication', ResponsableCOMString, '<:pentool:1137435985186136195>'),
                createSelectionMenuOption('event', 'Event', ResponsableEVENTString, '<:speaker:1137428526178517033>'),
                createSelectionMenuOption('esport', 'Esport', ResponsableESPORTString, '<:crosshair:1137436482248904846>'),
                createSelectionMenuOption('partenariat', 'Partenariat', ResponsablePARTENARIATString, '<:dollarsign:1137435764142116904>')
            ]

            const selectionMenu = createSelectionMenu('menuSelectPoleRespo', 'Selectionner un pôle', respoOptionsArray, 1, 1)

            const menuMessage = await dmChannel.send({
                embeds: [new MessageEmbed().setDescription('<:arrowdown:1137420436016214058> De quel pôle cet utilisateur est-il responsable? <:arrowdown:1137420436016214058>').setColor('2b2d31')],
                components: [createMessageActionRow([selectionMenu])]
            })

            const selectionMenuInteraction = await menuInteraction(menuMessage).catch(err => console.log(err))
            if (!selectionMenuInteraction) return;

            const stringInputRoleRespo = selectionMenuInteraction.values[0];

            const selectedOption = selectionMenuInteraction.component.options.find(option => option.value === stringInputRoleRespo)
            selectionMenuInteraction.update({
                embeds: [new MessageEmbed().setDescription(`<:check:1137390614296678421> Selectionné : \`${stringInputRoleRespo.toUpperCase()}\` <:check:1137390614296678421>`).setColor('2b2d31')],
                components: [createMessageActionRow([selectionMenuInteraction.component.setPlaceholder(selectedOption.label).setDisabled(true)])]
            })

            

            const existingRespo = await mongoose.model('User').findOne({ onServer: true, roleResponsable: stringInputRoleRespo })


            if (existingRespo) {
                let existingRespoGuildMember = allMembers.get(existingRespo.discordId)
                const rolesToRemove = allRoles.filter(role => (role.id === '624715133251223572' || role.id === '622120800333463555' || role.id === '743988023859085332') && existingRespoGuildMember.roles.cache.has(role.id))
                existingRespo.isResponsable = false
                existingRespo.roleResponsable = undefined
                try {
                    await existingRespo.save();
                    existingRespoGuildMember.roles.remove(rolesToRemove)
                    dmChannel.send(`**<:check:1137390614296678421> | **\`\`${existingRespo.username}\`\` a bien été retiré du poste de responsable \`${stringInputRoleRespo.toUpperCase()}\` !`)
                    configLogger.info(`<@!${interaction.user.id}> a retiré \`${existingRespo.username}\` du poste de responsable \`${stringInputRoleRespo.toUpperCase()}\``)
                } catch (err) {
                    dmChannel.send(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
                }
                
            }
    
            if (guildMember) {
                const User = await mongoose.model('User').findOne({ discordId: guildMember.user.id });
                const rolesToAdd = allRoles.filter(role => (role.id === '624715133251223572' || role.id === '622120800333463555' || role.id === '743988023859085332') && !guildMember.roles.cache.has(role.id))
                if (User && User.id) {
                    User.isResponsable = true;
                    User.roleResponsable = stringInputRoleRespo
                    User.save();
                    await guildMember.roles.add(rolesToAdd)
                    if (!isMember(User)) await registerMember(guildMember, User)
                    await dmChannel.send(`**<:check:1137390614296678421> | **\`\`${guildMember.user.username}\`\` a bien été ajouté en tant que responsable du pôle \`${stringInputRoleRespo.toUpperCase()}\` !`)
                    await configLogger.info(`<@!${interaction.user.id}> a ajouté \`${guildMember.user.username}\` en tant que responsable \`${stringInputRoleRespo.toUpperCase()}\``)
                } else {
                    await dmChannel.send(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
                }
            }
        } else if (manageSelection.customId === '<:x_:1137419292946727042>') {
            selectorReply(manageSelection, '<:x_:1137419292946727042>', 'Retirer un membre du poste de responsable')
            const stringInputUser = await userResponseContent(dmChannel, "Quel utilisateur souhaitez vous retirer du poste de responsable ?").catch(err => console.log(err))
            if (!stringInputUser) return

            let guildMember = allMembers.find(m => m.user.tag.toLowerCase().includes(stringInputUser.toLowerCase()));

            if (!guildMember) return dmChannel.send(`**<:x_:1137419292946727042> | **Utilisateur introuvable !`)

            const existingRespo = await mongoose.model('User').findOne({ onServer: true, discordId: guildMember.user.id, isResponsable: true })

            

            if (existingRespo) {
                const roleRespo = existingRespo.roleResponsable
                const rolesToRemove = allRoles.filter(role => (role.id === '624715133251223572' || role.id === '622120800333463555' || role.id === '743988023859085332') && guildMember.roles.cache.has(role.id))
                existingRespo.isResponsable = false
                existingRespo.roleResponsable = undefined
                try {
                    await existingRespo.save();
                    guildMember.roles.remove(rolesToRemove)
                    dmChannel.send(`**<:check:1137390614296678421> | **\`\`${existingRespo.username}\`\` a bien été retiré du poste de responsable \`${roleRespo.toUpperCase()}\` !`)
                    configLogger.info(`<@!${interaction.user.id}> a retiré \`${existingRespo.username}\` du poste de responsable \`${roleRespo.toUpperCase()}\``)
                } catch (err) {
                    dmChannel.send(`**<:x_:1137419292946727042> | **INTERNAL SERVER ERROR : DB CORRUPTION`)
                }
                
            } else dmChannel.send(`**<:x_:1137419292946727042> | **Cet utilisateur n'est pas responsable !`)

        }
    }
}

async function registerMember(member, dBUser) {
    const dmChannel = await member.createDM()

    const componentRow = createButtonActionRow([
        createEmojiButton('askMemberInformation', 'Je suis prêt à remplir le formulaire', 'SECONDARY', '<:checksquare:1137390612543459398>')
    ])
    const embed = new MessageEmbed()
        .setTitle(`\` BIENVENUE CHEZ LDV ESPORT \``)
        .setDescription(`Afin de finaliser ton inscription en tant que membre de LDV Esport, nous aurons besoin que quelques informations sur toi.\nClique sur le bouton juste en dessous une fois que tu es prêt à remplir ce formulaire !`)
        .setColor('#2b2d31')
    try {
        dmChannel.send({
            embeds: [embed],
            components: [componentRow]
        })
        if (dBUser && dBUser.id) {
            dBUser.isMember = true;
            await dBUser.save();
        } else {
            await User.create({
                username: member.user.username,
                discordId: member.user.id,
                userTag: member.user.tag,
                avatarURL: member.user.displayAvatarURL(),
                onServer: true,
                isMember: true
            })
        }
    } catch (err) {
        console.log(err)
    }
}