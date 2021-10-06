const mongoose = require('mongoose');

const fs = require('fs').promises;
const fse = require('fs-extra');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const dom = new JSDOM();
const document = dom.window.document;

function createTicketTranscript(client, savingName, ticketDmChannelId, guildId) {
    return new Promise(async (resolve, reject) => {
        const TicketMessages = await mongoose.model('Ticket').findOne({ dmChannelId: ticketDmChannelId, archive: false }, 'messages -_id').exec();
        const guild = await client.guilds.cache.get(guildId)
    
        let templateData = await fs.readFile('./src/templates/template.html', 'utf8').catch(err => console.log(err));
    
        await fse.outputFile(`./files/transcripts/transcript-${savingName}.html`, templateData).catch(err => console.log(err));
        let guildElement = document.createElement('div');
        let guildText = document.createTextNode(guild.name);
        let guildImg = document.createElement('img');
        guildImg.setAttribute('src', guild.iconURL());
        guildImg.setAttribute('width', '150');
        guildElement.appendChild(guildImg);
        guildElement.appendChild(guildText);
        await fs.appendFile(`./files/transcripts/transcript-${savingName}.html`, guildElement.outerHTML).catch(err => console.log(err));
    
    
        for (const index in TicketMessages.messages) {
            const msg = TicketMessages.messages[index]
            let parentContainer = document.createElement("div");
            parentContainer.className = "parent-container";
    
            let avatarDiv = document.createElement("div");
            avatarDiv.className = "avatar-container";
            let img = document.createElement('img');
            img.setAttribute('src', msg.authorAvatarURL);
            img.className = "avatar";
            avatarDiv.appendChild(img);
    
            parentContainer.appendChild(avatarDiv);
    
            let messageContainer = document.createElement('div');
            messageContainer.className = "message-container";
    
            let nameElement = document.createElement("span");
            let name = document.createTextNode(msg.authorTag + " " + msg.createdAt);
            nameElement.appendChild(name);
            messageContainer.append(nameElement);
    
            if(msg.content.startsWith("```")) {
                let m = msg.content.replace(/```/g, "");
                let codeNode = document.createElement("code");
                let textNode =  document.createTextNode(m);
                codeNode.appendChild(textNode);
                messageContainer.appendChild(codeNode);
            }
            else {
                let msgNode = document.createElement('span');
                let textNode = document.createTextNode(msg.content);
                msgNode.append(textNode);
                messageContainer.appendChild(msgNode);
            }
            parentContainer.appendChild(messageContainer);
            await fs.appendFile(`./files/transcripts/transcript-${savingName}.html`, parentContainer.outerHTML).catch(err => console.log(err));
        }
    
        resolve(`transcript-${savingName}.html`)
    })
}

module.exports = {
    createTicketTranscript
}