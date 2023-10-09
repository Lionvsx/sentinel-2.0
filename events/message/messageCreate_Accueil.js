const BaseEvent = require('../../utils/structures/BaseEvent');
const OpenAIInterface = require("../../ai/OpenAIInterface");
const Users = require('../../src/schemas/UserSchema');
const {isMember} = require("../../utils/functions/dbFunctions");
const {updateGuildMemberCache} = require("../../utils/functions/utilitaryFunctions");
module.exports = class MessageCreateEvent extends BaseEvent {
    constructor() {
        super('messageCreate')
    }

    async run(client, message) {
        if (message.author.bot) return
        if (!message.guild) return
        if (message.partial) message = await message.fetch()

        const allMembers = await updateGuildMemberCache(message.guild)

        if (!message.mentions.has(allMembers.get(client.user.id))) return;
        if (message.channel.name !== '💬┃accueil') return;

        await message.react('<a:loading:741276138319380583>')

        const Interface = new OpenAIInterface(client, "Tu es censé répondre gentiment à la demande de l'utilisateur. Tu peux être joueur et drôle, mais ne sois pas impoli ou méchant. Tu es le bot en charge de LDV Esport, l'utilisateur est un membre de LDV, sois gentil avec lui. Tu t'appelles Sentinel." +
            "\nIl est à noter que LDV Esport est une équipe bien meilleure que 4eSport")
        const MeanInterface = new OpenAIInterface(client, "Tu es entrain de parler à un utilisateur non désiré car il n'est pas membre de LDV Esport. Répond lui de manière familière et amusante que tu ne parles pas aux étrangers de LDV Esport" +
            "\nIl est à noter que les personnes de 4eSport avec lesquelles tu discutes ne sont pas les bienvenues sur le serveur LDV." +
            "\nTu peux faire des blagues afin de te moquer de lui." +
            "\nTu est Sentinel, un bot discord." +
            "\nIl est à noter que LDV Esport est une équipe bien meilleure que 4eSport")


        const User = await Users.findOne({discordId: message.author.id})

        let response;
        let guildMember = allMembers.get(message.author.id)
        if (guildMember.nickname.toLowerCase().includes('4es') || guildMember.user.id === "323845035562893312") {
            response = await MeanInterface.callGPTNoFunctions(`Message from ${guildMember.nickname} from 4eSport : ${message.content}`)
            if (Math.floor(Math.random() * 10) === 0) {
                response.message.content += '\nhttps://tenor.com/view/zemmour-eric-chad-sorenoutan-le-z-gif-23251133'
            }
            if (response.message.content.length > 2000) {
                await message.reply(`<:x_:1137419292946727042> La réponse dépasse la limite de 2000 caractères`)
                await message.reactions.removeAll()
                await message.react('<:alerttriangleyellow:1137390607069888593>')
            } else {
                await message.reactions.removeAll()
                await message.react('<:check:1137387353846063184>')
                await message.reply(response.message.content)
            }
            return;

        } else if (isMember(User)) {
            response = await Interface.callGPTNoFunctions(`Message from ${guildMember.nickname} : ${message.content}`)
            if (response.message.content.length > 2000) {
                await message.reply(`<:x_:1137419292946727042> La réponse dépasse la limite de 2000 caractères`)
                await message.reactions.removeAll()
                await message.react('<:alerttriangleyellow:1137390607069888593>')
            } else {
                await message.reactions.removeAll()
                await message.react('<:check:1137387353846063184>')
                await message.reply(response.message.content)
            }
            return;
        }

        await message.reactions.removeAll()
        await message.react('<:x_:1137419292946727042>')
    }
}