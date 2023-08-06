const emojiRegex = require('emoji-regex');
const fs = require('fs-extra');
const https = require('https');


const DiscordLogger = require('../services/discordLoggerService')
const {
    createMessageActionRow,
    createSelectionMenu,
    createButtonActionRow,
    createEmojiButton,
    createSelectionMenuOption
} = require("./messageComponents");
const {MessageEmbed} = require("discord.js");
const envLogger = new DiscordLogger('environnement', '#00cec9')

function removeEmojis (string) {
    var regex =emojiRegex();
  
    return string?.replace(regex, '');
}

function getEmoji (string) {
    let stringWithoutEmoji = removeEmojis(string);

    return string?.replace(stringWithoutEmoji, '')
}

function removeDivider (string) {
    var regex = /[『』┃┋︙]/g

    return string?.replace(regex, '');
}

function getDivider (string) {
    let stringWithoutDivider = removeDivider(string);

    return string?.replace(stringWithoutDivider, '')
}
/**
 * 
 * @param {string} path 
 * @param {string} url 
 * @returns {void}
 */
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
/**
 * 
 * @param {string} path 
 * @returns {File} file data
 */
const readFile = (path) => {
    return new Promise(async (resolve, reject) => {
        fs.readFile(path, (err, data) => {
            if (err) return reject(err);
            else if (data) return resolve(data);
        })
    })
}

function fetchName(str) {
    return str.replace(/[^a-zA-Z éèêàù]+/g, '').trim();
}

/**
 * 
 * @param {number} ms time in milliseconds
 * @returns {void}
 */
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}
/**
 * 
 * @param {object} guild discord guild object
 * @param {string[]} searchArgs arguments array
 * @returns {Promise<unknown>} array of user objects
 */
const getUsersFromString = (guild, searchArgs) => {
    return new Promise(async (resolve) => {
        const userArray = []
        await updateGuildMemberCache(guild)
        for (const arg of searchArgs) {
            const roleMatch = guild.roles.cache.find(role => role.name.toLowerCase().includes(arg.toLowerCase()))
            const userMatch = guild.members.cache.find(m => m.user.tag.toLowerCase().includes(arg.toLowerCase()))
            if (roleMatch) {
                const userMatchingRole = guild.members.cache.filter(m => m.roles.cache.has(roleMatch.id))
                for (const [, member] of userMatchingRole) {
                    userArray.push(member)
                }
            } else if (userMatch) {
                userArray.push(userMatch)
            }
        }

        resolve(userArray)
    })
}
/**
 * 
 * @param {object} guild discord guild object
 * @param {string[]} searchArgs arguments array
 * @returns {object[]} array of user objects
 */
 const getUsersAndRolesFromString = (guild, searchArgs) => {
    return new Promise(async (resolve) => {
        const resultArray = []
        await updateGuildMemberCache(guild)
        for (const arg of searchArgs) {
            const roleMatch = guild.roles.cache.find(role => role.name.toLowerCase().includes(arg.toLowerCase()))
            const userMatch = guild.members.cache.find(m => m.user.tag.toLowerCase().includes(arg.toLowerCase()))
            if (roleMatch) {
                resultArray.push(roleMatch)
            } else if (userMatch) {
                resultArray.push(userMatch)
            }
        }

        resolve(resultArray)
    })
}

/**
 *
 * @param value
 * @param index
 * @param self
 * @returns {boolean}
 */
function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

/**
 * 
 * @param {object} guild 
 * @returns {object} guild members cache
 */
const updateGuildMemberCache = async (guild) => {
    const guildMembersCache = guild.members.cache

    envLogger.setLogMember(guild.client)
    envLogger.setGuild(guild)
    envLogger.setLogData(`CACHED USERS: ${guildMembersCache.size}\nUSERS ON SERVER: ${guild.memberCount}\nUNCACHED USERS: ${guild.memberCount - guildMembersCache.size}`)

    if (guildMembersCache.size !== guild.memberCount) {
        envLogger.warning(`Le cache des utilisateurs du serveur \`${guild.name}\` était incomplet\nProcédure de remise en cache :`)
        await guild.members.fetch();
    }
    return guild.members.cache
}
/**
 * 
 * @param {object} guild 
 * @returns {object} guild channels cache
 */
const updateGuildChannelCache = async (guild) => {
    const guildChannelsCache = guild.channels.cache
    const cachedChannelsBefore = guildChannelsCache ? guildChannelsCache.size : undefined

    envLogger.setLogMember(guild.client)
    envLogger.setGuild(guild)

    await guild.channels.fetch()
    const cachedChannelsAfter = guildChannelsCache ? guildChannelsCache.size : undefined
    envLogger.setLogData(`CACHED CHANNELS: ${cachedChannelsBefore}\nCHANNELS ON SERVER: ${cachedChannelsAfter}\nUNCACHED CHANNELS: ${cachedChannelsAfter - cachedChannelsBefore}`)
    if (cachedChannelsAfter !== cachedChannelsBefore) {
        await envLogger.warning(`Le cache des channels du serveur \`${guild.name}\` était incomplet\nProcédure de remise en cache :`)
    } else {
        await envLogger.info(`Demande de mise à jour du cache des channels effectué pour le serveur \`${guild.name}\`\nCache à jour :`)
    }
    return guild.channels.cache
}
/**
 * 
 * @param {object} guild 
 * @returns {object} fetched Guild
 */
const updateGuildCache = async (guild) => {
    const fetchedGuild = await guild.fetch();
    await updateGuildMemberCache(fetchedGuild);
    await updateGuildChannelCache(fetchedGuild);
    return fetchedGuild
}
/**
 * 
 * @param {*[]} arr 
 * @param {Number} chunkSize 
 * @returns 
 */
function chunkArray(arr, chunkSize) {
    const res = [];
    for (let i = 0; i < arr.length; i += chunkSize) {
        const chunk = arr.slice(i, i + chunkSize);
        res.push(chunk);
    }
    return res;
}
/**
 * 
 * @param {*[]} array 
 * @returns Array with duplicates
 */
function getDuplicates(array) {
    return array.filter((value, index) => data.indexOf(value) !== index)
}


/**
 * 
 * @param {*[]} array1 
 * @param {*[]} array2 
 * @returns {*[]}
 */
const substractArrays = (array1, array2) => {
    array1.filter((e) => {
        let i = array2.indexOf(e)
        return i === -1 ? true : (array2.splice(i, 1), false)
    })
}

/**
 *
 * @param {String} str
 * @returns {string}
 */
function fetchEmoji(str) {
    let i = 0
    let char = str.charAt(i)
    while (i < str.length && (char === '─' || char === ' ')) {
        i++
        char = str.charAt(i)
    }
    const emoji = `${char + str.charAt(i+1)}`
    return String.fromCodePoint(emoji.codePointAt(0));
}

/**
 *
 * @param {object} interaction
 * @param {string[]} arrayOfCategoryIds
 * @param {number} index
 * @param {object[]} categoriesMap
 * @param {object} allChannels
 */
function updateSelectionMenu(interaction, arrayOfCategoryIds, index, categoriesMap, allChannels) {


    index = ((index%categoriesMap.length) + categoriesMap.length)%categoriesMap.length

    const selectMenu = createMessageActionRow([createSelectionMenu(`catMenu`, `Page ${index + 1}`, categoriesMap[index], 1, categoriesMap[index].length)])
    const buttonRow = createButtonActionRow([createEmojiButton(`previous`, 'Page précédente', 'SECONDARY', '<:arrowleftcircle:1137421111378837585>'), createEmojiButton(`valid`, 'Valider', 'SUCCESS', '<:check:1137390614296678421>'), createEmojiButton(`next`, 'Page suivante', 'SECONDARY', '<:arrowrightcircle:1137421115766083726>')])


    const selectedCategories = allChannels.filter(channel => channel.type === 'GUILD_CATEGORY' && arrayOfCategoryIds.includes(channel.id))

    let embedSelected = new MessageEmbed()
        .setColor('2b2d31')
        .setTitle('Catégories sélectionnées')
        .setDescription(`\`\`\`\n${selectedCategories?.size > 0 ? selectedCategories.map(chan => chan.name).join('\n'): 'Aucune'}\`\`\`\n\n<:arrowdown:1137420436016214058> Veuillez sélectionner une catégorie ci-dessous <:arrowdown:1137420436016214058>`)

    interaction.update({
        embeds: [embedSelected],
        components: [selectMenu, buttonRow]
    })
}


/**
 *
 * @param {String} channels
 * @returns {void}
 */
function fillSelectMap(channels) {
    let i = 0
    let tmpArr = []
    let map = []

    for (const [, chan] of channels) {
        if (i === 25) {
            i = 0
            map.push(tmpArr)
            tmpArr = []
        }
        tmpArr.push(createSelectionMenuOption(chan.id, fetchName(chan.name), undefined, fetchEmoji(chan.name)))
        i++
    }
    map.push(tmpArr)
    return map
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
    updateGuildMemberCache,
    chunkArray,
    getDuplicates,
    substractArrays,
    getUsersAndRolesFromString,
    getDivider,
    onlyUnique,
    fetchEmoji,
    fetchName,
    fillSelectMap,
    updateSelectionMenu
};