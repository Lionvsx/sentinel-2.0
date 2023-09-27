const { MessageEmbed } = require("discord.js");
const { getDateTime } = require('../functions/systemFunctions');

class LoggerService {
    constructor(category, defaultColor) {
        this.logData = null;
        this.category = category;
        this.defaultColor = defaultColor;
        this.logMember = null;
        this.guild = null;
        this.logChannel = null;

        this.createLogEmbed = (message, color, level) => {
            const logEmbed = new MessageEmbed()
                .setColor('#2b2d31')

            let emoji;
            switch (this.category) {
                case "environnement":
                    emoji = '<:terminal:1137761058833051788> ` ENVIRONNEMENT `'
                    break;
                case "database":
                    emoji = '<:database:1137761051144892559> ` DATABASE `'
                    break;
                case "annonces":
                    emoji = '<:send:1137390655019171960> ` ANNONCES `'
                    break;
                case "tickets":
                    emoji = '<:messagesquare:1137390645972049970> ` TICKETS `'
                    break;
                case "moderation":
                    emoji = '<:shield:1137411685716611143> ` MODERATION `'
                    break;
                case "config":
                    emoji = '<:settings:1137410884432564404> ` CONFIG `'
                    break;
                default:
                    emoji = '<:activity:1137390592314331176> ` LOG `'
                    break;
            }

            this.logData
                ? logEmbed.setDescription(`\`\`\`${getDateTime()} | ${level.toUpperCase()} | ${this.category.toUpperCase()}\`\`\`\n${message}\n\`\`\`\n${this.logData}\`\`\``)
                : logEmbed.setDescription(`\`\`\`${getDateTime()} | ${level.toUpperCase()} | ${this.category.toUpperCase()}\`\`\`\n${message}`);
            this.logMember
                ? logEmbed.setAuthor(this.logMember.user.tag, this.logMember.user.displayAvatarURL())
                : null;
            return logEmbed.setTitle(emoji)
        }
    }

    setLogData(logData) {
        this.logData = logData;
    }

    setLogMember(member) {
        this.logMember = member;
    }

    setGuild(guild) {
        this.guild = guild;
        const guildConfig = guild.client.config.get(guild.id)
        this.logChannel = guildConfig.logChannelId ? guild.channels.cache.get(guildConfig.logChannelId) : undefined
    }

    async error(message) {
        const embed = this.createLogEmbed(message, '#e74c3c', 'error')
        this.logChannel ? this.logChannel.send({
            embeds: [embed]
        }) : null
    }

    async warning(message) {
        const embed = this.createLogEmbed(message, '#f39c12', 'warning')
        this.logChannel ? this.logChannel.send({
            embeds: [embed]
        }) : null
    }

    async info(message) {
        const embed = this.createLogEmbed(message, this.defaultColor, 'info')
        this.logChannel ? this.logChannel.send({
            embeds: [embed]
        }) : null
    }
}

module.exports = LoggerService;