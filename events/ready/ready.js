const BaseEvent = require('../../utils/structures/BaseEvent');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const Guild = require('../../src/schemas/GuildSchema')
const User = require('../../src/schemas/UserSchema')
const Tickets = require('../../src/schemas/TicketSchema')
const { showCommandLoad } = require('../../utils/register')

require('dotenv').config

module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
        super('ready')
    }

    async run(client) {
        client.user.setPresence('Test')
        console.log(`Bot ${client.user.username} loaded and ready !`)
        showCommandLoad()

        const rest = new REST({ version: '9' }).setToken(process.env.DISCORD_BOT_TOKEN);
        const commands = []

        for (const [name, interaction] of client.interactions) {
            if (interaction.type === 'slashCommand') commands.push(interaction.help.commandData.toJSON())
        }
        
    
        for (const [key, value] of client.guilds.cache) {
            const guildConfig = await Guild.findOne({ guildId: key });
            await client.guilds.cache.get(key).members.fetch()
            if (guildConfig) {
                client.config.set(key, guildConfig)
                console.log(`Loaded data for guild : ${value.name}`)

                if (guildConfig.slashCommands === true) {
                    if (commands.length > 0) {
                        try {
                            console.log('Started refreshing application (/) commands.');
                
                            await rest.put(
                                Routes.applicationGuildCommands(client.user.id, key),
                                { body: commands },
                            );

                            console.log(`Loaded ${commands.length} (/) commands !`)
                
                            console.log('Successfully reloaded application (/) commands.');
                        } catch (error) {
                            console.error(error);
                        }
                    }
                    
                }
            } else {
                Guild.create({
                    guildId: key,
                    guildName: value.name
                }, async (err) => {
                    if (err) throw err && console.log(`There was an error trying to save GUILD : ${value.name} to the database !`)
                    else console.error(`⚠️ Guild : ${value.name} wasn't saved in the database, created new entry ! ⚠️`)
                }) 
            }
        }

        const Users = await User.find({ onServer: true })
        for (const user of Users) {
            client.allUsers.set(user.discordId, user)
        }
        // const Tickets = await Tickets.find({ archive: false })
        // for (const ticket of Tickets) {
        //     client.allTickets.set(ticket.ticketChannelId, ticket)
        // }

        console.log(`Cached Users : ${client.allUsers.size}`)

        

        
    }
}