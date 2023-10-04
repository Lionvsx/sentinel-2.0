const cron = require('node-cron');
const Teams = require("../src/schemas/TeamSchema");
const {updatePastEventEmbed, cancelEvent, alertTeamMembers, getTeamStaff} = require("../utils/functions/teamsFunctions");
const {MessageEmbed, Permissions} = require("discord.js");
const {createEmojiButton, createMessageActionRow, createButtonActionRow} = require("../utils/functions/messageComponents");
const Ticket = require("../src/schemas/TicketSchema");
const mongoose = require("mongoose");
const {getNotionPageById} = require("../utils/functions/notionFunctions");

const StaffChannels = new Map([
    ['da', '741810218081583244'],
    ['com', '742403805290692650'],
    ['event', '742403832059002912'],
    ['webtv', '741961837834403930'],
    ['bureau', '742403764211679342'],
    ['stafftechnique', '742404106676862996'],
    ['partenariat', '894736357241544774'],
    ['esport', '898532117292666910']
]);

let tasks = {};  // Un objet pour stocker les tâches planifiées selon l'ID de la guilde.

module.exports = {
    scheduleEventTask: (guild) => {
        if (tasks[guild.id]) {
            tasks[guild.id].stop();
        }
        // Every 5 minutes
        tasks[guild.id] = cron.schedule('*/5 * * * *', async () => {
            console.log("Running event scheduled task")
            const AllTeams = await Teams.find();
            if (!AllTeams) return

            for (const Team of AllTeams) {
                // Check if team has smart manager enabled
                if (!Team.smartManager) continue;

                if (Team.events.length < 1) continue;

                let parentChannel = guild.channels.cache.get(Team.linkedCategoryId);
                let organisationChannel = parentChannel.children.find(channel => channel.name.includes('organisation'));
                let staffChannel = parentChannel.children.find(channel => channel.name.includes('staff'))

                let Events = Team.events.filter(event => !event.archived);

                if (Events.length < 1) continue;


                for (const Event of Events) {
                    let addScoreButton = createEmojiButton(`addScore|${Event._id}`, 'Add score', 'SECONDARY', '<:editpen:1137390632445431950>')
                    let addTournamentResultButton = createEmojiButton(`addTournamentResult|${Event._id}`, 'Add result', 'SECONDARY', '<:editpen:1137390632445431950>')

                    let currentTime = Math.floor(Date.now() / 1000);
                    let participants = Event.rsvps.filter(rsvp => rsvp.attending === "yes")
                    let participantsDiscordIds = participants.map(rsvp => rsvp.userId)

                    if (Event.discordTimestamp + Event.duration * 60 < currentTime) {
                        let newEmbed = updatePastEventEmbed(Event);
                        let message = await organisationChannel.messages.fetch(Event.messageId);
                        Event.archived = true;
                        if (Event.type !== "team-building" && Event.type !== "review" && Event.type !== "tournament") {
                            message.edit({
                                embeds: [newEmbed],
                                components: [
                                    createMessageActionRow([addScoreButton])
                                ]
                            });
                        } else if (Event.type === "tournament") {
                            message.edit({
                                embeds: [newEmbed],
                                components: [
                                    createMessageActionRow([addTournamentResultButton])
                                ]
                            });
                        } else {
                            message.edit({
                                embeds: [newEmbed],
                                components: []
                            });
                        }
                        continue;
                    }

                    // If event starts in less than 30 min, send a reminder
                    if (Event.discordTimestamp - 1800 <= currentTime && currentTime <= Event.discordTimestamp - 1500) {
                        for (const participant of participantsDiscordIds) {
                            let dmChannel = await guild.members.cache.get(participant).createDM();
                            dmChannel.send({
                                embeds: [new MessageEmbed().setDescription(`<:bell:1153604390356271124> L'événement ${Event.name} va commencer dans <t:${Event.discordTimestamp}:R>`).setColor("#2b2d31")]
                            })
                        }
                    }
                    if (Event.discordTimestamp - 900 <= currentTime && Event.type !== "tournament") { // Check if event starts in less than 15 min
                        if (participants.length < Event.slots) { // Check if event is full
                            let missingPlayers = Event.slots - participants.length;
                            if (missingPlayers > Event.slots / 2) {
                                await cancelEvent(guild, Team, Event.id)
                                await staffChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setDescription(`<:alerttriangleyellow:1137390607069888593> L'événement ${Event.name} n'est pas complet. J'ai annulé l'événement car il restait moins de 15 minutes`)
                                            .setColor("#2b2d31")
                                    ]
                                })
                            }
                        }
                    }
                    if (currentTime - 2.5*60 <= Event.discordTimestamp - 21600 && Event.discordTimestamp - 21600 <= currentTime + 2.5*60) {
                        if (participants.length < Event.slots) {
                            let missingPlayers = Event.slots - participants.length;
                            if (missingPlayers > Event.slots) {
                                await alertTeamMembers(guild, Team, Event)
                                await staffChannel.send({
                                    embeds: [
                                        new MessageEmbed()
                                            .setDescription(`<:alerttriangleyellow:1137390607069888593> L'événement ${Event.name} n'est pas complet. J'ai envoyé une notification à tous les membres de l'équipe pour qu'ils répondent.`)
                                            .setColor("#2b2d31")
                                    ]
                                })
                            }
                        }
                    }

                    if (Event.type === "tournament" && !Event.ticketCreated) {
                        let notionPage = await getNotionPageById(Team.linkedNotionPageId)
                        let teamStaff = await getTeamStaff(notionPage)
                        const ticketPermissions = [{ id: '743052360368259093', allow: [Permissions.FLAGS.VIEW_CHANNEL] }, {id: guild.roles.everyone.id, deny: [Permissions.FLAGS.VIEW_CHANNEL] }]
                        let staffPerms = teamStaff[0].map(staff => {
                            return {
                                id: staff,
                                allow: [Permissions.FLAGS.VIEW_CHANNEL]
                            }
                        })
                        ticketPermissions.push(...staffPerms)



                        const ResponsableWebTV = await mongoose.model('User').findOne({ roleResponsable: 'webtv' })
                        const ResponsableDA = await mongoose.model('User').findOne({ roleResponsable: 'da' })
                        const ResponsableCOM = await mongoose.model('User').findOne({ roleResponsable: 'com' })

                        ResponsableCOM && ResponsableCOM.discordId ? ticketPermissions.push({ id: ResponsableCOM.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] }) : null
                        ResponsableDA && ResponsableDA.discordId ? ticketPermissions.push({ id: ResponsableDA.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL]}) : null

                        const ticketEmbed = new MessageEmbed()
                            .setTitle(Event.name)
                            .addFields(
                                { name: '<:zap:1137424324144410736> | JEU', value: Team.game ? Team.game : 'Non défini'},
                                { name: '<:users:1137390672194850887> | EQUIPE / JOUEURS', value: Team.name},
                                { name: '<:calendar:1137424147056689293> | DATE', value: `<t:${Event.discordTimestamp}:F>`},
                                { name: '<:link:1137424150764474388> | LIENS', value: Event.trackerLink ? `[Tracker](${Event.trackerLink})` : 'Non défini'},
                                { name: '<:video:1137424148352737310> | CAST', value: "A voir avec le manager"},
                            )
                            .setColor('#2b2d31')

                        // For ticket name remomve emojis and ` char from event.name
                        let ticketName = Event.name.replace(/<:[a-zA-Z0-9]+:[0-9]+>/g, '').replace(/`/g, '').trim()
                        const accessEmbed = new MessageEmbed()
                            .setTitle(`<:messagesquare:1137390645972049970> NOUVEAU TICKET : \`${ticketName}\``)
                            .setDescription(`Nouveau ticket de \`${guild.client.user.username}\`\nNom de l'event : \`${ticketName}\`\nJeu associé : \`${Team.game ? Team.game : 'Non défini'}\`\nDate : <t:${Event.discordTimestamp}:F>`)
                            .setTimestamp()
                            .setColor('#2b2d31')

                        const newChannel = await guild.channels.create(`🎫┃${ticketName}`, {
                            type: 'GUILD_TEXT',
                            position: 100,
                            permissionOverwrites: ticketPermissions,
                            parent: guild.channels.cache.find(channel => channel.name.includes('📨tickets📨') && channel.type === 'GUILD_CATEGORY')
                        })
                        await newChannel.send({
                            content: '@everyone',
                            embeds: [ticketEmbed]
                        })
                        const newTicket = await Ticket.create({
                            ticketChannelId: newChannel.id,
                            guildId: newChannel.guild.id,
                            authorId: guild.client.user.id,
                            name: ticketName
                        })
                        const accessChannelsAudience = [StaffChannels.get('da'), StaffChannels.get('com')]
                        if (ResponsableWebTV && ResponsableWebTV.discordId) ticketPermissions.push({ id: ResponsableWebTV.discordId, allow: [Permissions.FLAGS.VIEW_CHANNEL] })
                        accessChannelsAudience.push(StaffChannels.get('webtv'))

                        guild.client.allTickets.set(newChannel.id, newTicket);

                        for (const channelId of accessChannelsAudience) {
                            let requestChannel = guild.channels.cache.get(channelId)
                            await requestChannel.send({
                                embeds: [accessEmbed],
                                components: [createButtonActionRow([createEmojiButton(`buttonAccessChannel|${newChannel.id}`, 'Accédez au ticket', 'SECONDARY', '<:pluscircle:1137390650690650172>'), createEmojiButton(`buttonKillAccessChannel`, "Fermez l'accès au ticket", 'SECONDARY', '<:x_:1137419292946727042>')])]
                            })
                        }

                        // Send message to staff channels
                        await staffChannel.send({
                            embeds: [new MessageEmbed().setDescription(`<:messagesquare:1137390645972049970> L'événement ${ticketName} est un tournoi. J'ai créé un ticket pour le tournoi ici : <#${newChannel.id}>`).setColor("#2b2d31")]
                        })

                        Event.ticketCreated = true;
                    }
                }
                await Team.save();
            }
        })
    }
}