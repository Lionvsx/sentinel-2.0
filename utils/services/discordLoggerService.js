const { MessageEmbed } = require("discord.js")
myFormat = () => {
    return new Date(Date.now()).toUTCString();
};

class LoggerService {
    constructor(category, defaultColor) {
        this.logData = null;
        this.category = category;
        this.defaultColor = defaultColor;
        this.logMember = null;
        this.guild = null;
        this.logChannel = null;

        const createLogEmbed = (message, color, level) => {
            const logEmbed = new MessageEmbed()
                .setColor(color)

            this.logData 
                ? logEmbed.setDescription(`\`\`\`${myFormat()} | ${level.toUpperCase()} | ${this.category.toUpperCase()}\`\`\`\n${message}\n\`\`\`${this.logData}\`\`\``) 
                : logEmbed.setDescription(`\`\`\`${myFormat()} | ${level.toUpperCase()} | ${this.category.toUpperCase()}\`\`\`\n${message}\n\`\`\`${this.logData}\`\`\``);
            this.logMember
                ? logEmbed.setAuthor(this.logMember.user.tag, this.logMember.user.displayAvatarURL())
                : null;
            return logEmbed
        }

        this.createLogEmbed = createLogEmbed
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
        this.logChannel = guild.channels.cache.get(guildConfig.logChannelId)
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