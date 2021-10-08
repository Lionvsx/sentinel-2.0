const emojiRegex = require('emoji-regex');
const fs = require('fs-extra');
const https = require('https');

const DiscordLogger = require('../services/discordLoggerService')
const envLogger = new DiscordLogger('environnement', '#00cec9')

function removeEmojis (string) {
    var regex = emojiRegex();
  
    return string.replace(regex, '');
}

function getEmoji (string) {
    let stringWithoutEmoji = removeEmojis(string);

    return string.replace(stringWithoutEmoji, '')
}

function removeDivider (string) {
    var regex = /『|』|┃|┋|︙/g

    return string.replace(regex, '');
}

const downloadFile = (path, url) => {
    return new Promise(async (resolve) => {
        const file = fs.createWriteStream(path)
        https.get(url, response => {
            var stream = response.pipe(file);
          
            stream.on("finish", () => {
              resolve();
            });
          });
    })
}

const readFile = (path) => {
    return new Promise(async (resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) return reject(err);
            else if (data) return resolve(data);
        })
    })
}

const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const getUsersFromString = (guild, searchArgs) => {
    return new Promise(async (resolve) => {
        const userArray = []
        await updateGuildMemberCache(guild)
        for (const arg of searchArgs) {
            const roleMatch = guild.roles.cache.find(role => role.name.toLowerCase().includes(arg.toLowerCase()))
            const userMatch = guild.members.cache.find(m => m.user.tag.toLowerCase().includes(arg.toLowerCase()))
            if (roleMatch) {
                const userMatchingRole = guild.members.cache.filter(m => m.roles.cache.has(roleMatch.id))
                for (const [key, member] of userMatchingRole) {
                    userArray.push(member)
                }
            } else if (userMatch) {
                userArray.push(userMatch)
            }
        }

        resolve(userArray)
    })
}

const updateGuildMemberCache = async (guild) => {
    const guildMembersCache = guild.members.cache

    envLogger.setLogMember(guild.client)
    envLogger.setGuild(guild)
    envLogger.setLogData(`CACHED USERS: ${guildMembersCache.size}\nUSERS ON SERVER: ${guild.memberCount}\nUNCACHED USERS: ${guild.memberCount - guildMembersCache.size}`)

    if (guildMembersCache.size != guild.memberCount) {
        envLogger.warning(`Le cache des utilisateurs du serveur \`${guild.name}\` était incomplet\nProcédure de remise en cache :`)
        await guild.members.fetch();
    }
    return guild.members.cache
}

const updateGuildChannelCache = async (guild) => {
    const guildChannelsCache = guild.channels.cache
    const cachedChannelsBefore = guildChannelsCache ? guildChannelsCache.size : undefined

    envLogger.setLogMember(guild.client)
    envLogger.setGuild(guild)

    await guild.channels.fetch()
    const cachedChannelsAfter = guildChannelsCache ? guildChannelsCache.size : undefined
    envLogger.setLogData(`CACHED CHANNELS: ${cachedChannelsBefore}\nCHANNELS ON SERVER: ${cachedChannelsAfter}\nUNCACHED CHANNELS: ${cachedChannelsAfter - cachedChannelsBefore}`)
    if (cachedChannelsAfter != cachedChannelsBefore) {
        envLogger.warning(`Le cache des channels du serveur \`${guild.name}\` était incomplet\nProcédure de remise en cache :`)
    } else {
        envLogger.info(`Demande de mise à jour du cache des channels effectué pour le serveur \`${guild.name}\`\nCache à jour :`)
    }
    return guild.channels.cache
}

const updateGuildCache = async (guild) => {
    const fetchedGuild = await guild.fetch();
    await updateGuildMemberCache(fetchedGuild);
    await updateGuildChannelCache(fetchedGuild);
    return fetchedGuild
}

module.exports = {
    removeEmojis,
    getEmoji,
    removeDivider,
    downloadFile,
    readFile,
    sleep,
    getUsersFromString,
    updateGuildCache,
    updateGuildMemberCache
}


