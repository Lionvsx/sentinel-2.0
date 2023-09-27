const BaseEvent = require('../../utils/structures/BaseEvent');

const Guild = require('../../src/schemas/GuildSchema')
const User = require('../../src/schemas/UserSchema')
const { showCommandLoad } = require('../../utils/register')

const DiscordLogger = require('../../utils/services/discordLoggerService')

const { scheduleTeamTask} = require('../../scheduler/askAutoPlanning');
const {scheduleEventTask} = require("../../scheduler/autoCheckEvents");


require('dotenv').config

module.exports = class ReadyEvent extends BaseEvent {
    constructor() {
        super('ready')
    }

    async run(client) {
        client.user.setPresence('Test')
        console.log(`Bot ${client.user.username} loaded and ready !`)
        await showCommandLoad()

        const commands = []

        const sentinelLogger = new DiscordLogger('environnement', '#23e5ec')
        const ldvGuild = client.guilds.cache.get('227470914114158592')
        const logData = []

        for (const [name, interaction] of client.interactions) {
            if (interaction.type === 'slashCommand') commands.push(interaction.help.commandData.toJSON())
        }

        for (const [key, value] of client.guilds.cache) {
            const guildConfig = await Guild.findOne({ guildId: key });
            if (guildConfig) {
                client.config.set(key, guildConfig)
                console.log(`Loaded config data for guild : ${value.name}`)
                logData.push(`Loaded config data for guild : ${value.name}`)
            } else {
                Guild.create({
                    guildId: key,
                    guildName: value.name
                }, async (err) => {
                    if (err) throw err && console.log(`There was an error trying to save GUILD : ${value.name} to the database !`) && logData.push(`There was an error trying to save GUILD : ${value.name} to the database !`)
                    else console.error(`⚠️ Guild : ${value.name} wasn't saved in the database, created new entry ! ⚠️`) && logData.push(`⚠️ Guild : ${value.name} wasn't saved in the database, created new entry ! ⚠️`)
                }) 
            }
        }
        
    
        console.log('Started refreshing application (/) commands.');
        logData.push('Started refreshing application (/) commands.');
        for (const [key, value] of client.guilds.cache) {
            const guild = await client.guilds.cache.get(key)
            const guildConfig = client.config.get(key)
            await guild.members.fetch()
            if (guildConfig) {
                console.log(`Cached ${guild.members.cache.size} members data for guild : ${value.name}`)
                logData.push(`Cached ${guild.members.cache.size} members data for guild : ${value.name}`)
                if (guildConfig.slashCommands === true) {
                    if (commands.length > 0) {
                        try {
                            client.application.commands.set(commands, guild.id)
                            console.log(`Loaded ${commands.length} (/) commands for guild ${guild.name}`)
                            logData.push(`Loaded ${commands.length} (/) commands for guild ${guild.name}`)
                        } catch (err) {
                            console.error(err)
                        }
                    } else guild.commands.set([])
                    
                } else guild.commands.set([])
            }
        }
        console.log('Successfully reloaded application (/) commands.');
        logData.push('Successfully reloaded application (/) commands.')
        const Users = await User.find({ onServer: true })
        for (const user of Users) {
            client.allUsers.set(user.discordId, user)
        }

        console.log(`Cached Users on guild ${ldvGuild.name}: ${client.allUsers.size}`)
        logData.push(`Cached Users on guild ${ldvGuild.name}: ${client.allUsers.size}`)

        sentinelLogger.setGuild(ldvGuild)
        sentinelLogger.setLogMember(client)
        sentinelLogger.setLogData(logData.join('\n'))
        sentinelLogger.info(`Bot <@!${client.user.id}> Ready :`)

        scheduleTeamTask(ldvGuild)
        this.log('Team scheduler online')
        scheduleEventTask(ldvGuild)
        this.log('Smart Manager scheduler online')
    }
}