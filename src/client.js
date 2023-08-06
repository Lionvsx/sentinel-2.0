const { Client, Intents, Options } = require('discord.js');
const Logger = require('../utils/services/Logger');

class client extends Client {
    constructor() {
        super({ 
            intents: [
                Intents.FLAGS.GUILDS, 
                Intents.FLAGS.GUILD_MESSAGES, 
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS, 
                Intents.FLAGS.DIRECT_MESSAGES, 
                Intents.FLAGS.DIRECT_MESSAGE_REACTIONS, 
                Intents.FLAGS.GUILD_MEMBERS, 
                Intents.FLAGS.GUILD_BANS, 
                Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS, 
                Intents.FLAGS.GUILD_PRESENCES, 
                Intents.FLAGS.GUILD_VOICE_STATES], 
                partials: ['MESSAGE', 'CHANNEL', 'REACTION', 'GUILD_MEMBER'], 
                makeCache: Options.cacheWithLimits(Options.defaultMakeCacheSettings) 
            })
        this.commands = new Map();
        this.interactions = new Map();
        this.config = new Map();
        this.consoleLogger = new Logger('client');
        this.aliases = new Map();
        this.allUsers = new Map();
        this.allTickets = new Map();
        this.reactionRoles = new Map();
        this.clipboard = new Map();
    }

    /**
     *
     * @param message {String}
     * @param logData {JSON}
     * @return {void}
     */
    log(message, logData = undefined) {
        this.consoleLogger.log(message, 'info', logData);
    }

    /**
     *
     * @param message {String}
     * @param logData {JSON}
     * @return {void}
     */
    error(message, logData = undefined) {
        this.consoleLogger.log(message, 'error', logData);
    }
    /**
     *
     * @param message {String}
     * @param logData {JSON}
     * @return {void}
     */
    warning(message, logData = undefined) {
        this.consoleLogger.log(message, 'warn', logData);
    }
    async replySuccess(object, content) {
        if (object instanceof Interaction) return object.reply({content: `**${this.successEmoji} | **${content}`})
        if (object instanceof Message) return object.reply(`**${this.successEmoji} | **${content}`)
        if (object instanceof TextChannel) return object.send(`**${this.successEmoji} | **${content}`)
        if (object instanceof DMChannel) return object.send(`**${this.successEmoji} | **${content}`)
    }

    async replyError(object, content) {
        if (object instanceof Interaction) return object.reply({content: `**${this.errorEmoji} | **${content}`, ephemeral: true})
        if (object instanceof Message) return object.reply(`**${this.errorEmoji} | **${content}`)
        if (object instanceof TextChannel) return object.send(`**${this.errorEmoji} | **${content}`)
        if (object instanceof DMChannel) return object.send(`**${this.errorEmoji} | **${content}`)
    }

    async replyWarning(object, content) {
        if (object instanceof Interaction) return object.reply({content: `**${this.warningEmoji} | **${content}`, ephemeral: true})
        if (object instanceof Message) return object.reply(`**${this.warningEmoji} | **${content}`)
        if (object instanceof TextChannel) return object.send(`**${this.warningEmoji} | **${content}`)
        if (object instanceof DMChannel) return object.send(`**${this.warningEmoji} | **${content}`)
    }

    async replyLoading(object, content) {
        if (object instanceof Interaction) return object.reply({content: `**${this.loadingEmoji} | **${content}`})
        if (object instanceof Message) return object.reply(`**${this.loadingEmoji} | **${content}`)
        if (object instanceof TextChannel) return object.send(`**${this.loadingEmoji} | **${content}`)
        if (object instanceof DMChannel) return object.send(`**${this.loadingEmoji} | **${content}`)
    }
    get loadingEmoji() { return this.emojis.cache.get('741276138319380583') }
    get warningEmoji() { return this.emojis.cache.get('1134467379678675086') }
    get errorEmoji() { return this.emojis.cache.get('745912720565731328') }
    get successEmoji() { return this.emojis.cache.get('745912720502554635') }
    get shutdownEmoji() { return this.emojis.cache.get('1134467389111664750') }
    get gearEmoji() { return this.emojis.cache.get('1134467391590514750') }
    get profileEmoji() { return this.emojis.cache.get('1134467387383615498') }
    get lockEmoji() { return this.emojis.cache.get('1134467384095277246') }
    get appsEmoji() { return this.emojis.cache.get('1134467380882444289') }
    get trashEmoji() { return this.emojis.cache.get('1134467385609433301') }
    get loadEmoji() { return this.emojis.cache.get('1134467382803443822') }
    get plusEmoji() { return this.emojis.cache.get('822782782244782151') }
    get minusEmoji() { return this.emojis.cache.get('822782781960355850') }
    get hamburgerEmoji() { return this.emojis.cache.get('822782782157357097') }

    // Library #2
    get userEmoji() { return this.emojis.cache.get('1137390591043453028') }
    get usersEmoji() { return this.emojis.cache.get('1137390672194850887') }
    get sendEmoji() { return this.emojis.cache.get('1137390655019171960') }
    get slidersEmoji() { return this.emojis.cache.get('1137390661981720707') }
    get plusCircleEmoji() { return this.emojis.cache.get('1137390650690650172') }
    get minusCircleEmoji() { return this.emojis.cache.get('1137390648262135951') }
    get ticketEmoji() { return this.emojis.cache.get('1137390645972049970') }
    get checkSquareEmoji() { return this.emojis.cache.get('1137390612543459398') }
    get editEmoji() { return this.emojis.cache.get('1137390634605481986') }
    get triangleEmoji() { return this.emojis.cache.get('1137394274816753695') }
    get userPlusEmoji() { return this.emojis.cache.get('1137394694972788837') }
    get userMinusEmoji() { return this.emojis.cache.get('1137394849025359992') }
    get userXEmoji() { return this.emojis.cache.get('1137394869812351006') }


}
const discordClient = new client();
module.exports = discordClient;