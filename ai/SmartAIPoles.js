const OpenAIInterface = require('./OpenAIInterface');
const {
    getParisISOString, getParisUTCOffset, getParisCurrentDay
} = require('../utils/functions/systemFunctions');
const {DateTime} = require("luxon");
const Events = require('../src/schemas/EventSchema');
module.exports = class SmartAIManager extends OpenAIInterface {
    constructor(client, pole) {
        super(client, `Vous êtes Sentinel, un assistant IA propulsé par la technologie avancée GPT-4, spécialisé dans la gestion des événements au sein d'un pole d'une structure e-sport. Vous opérez spécifiquement sur un serveur Discord, où votre mission principale est de gérer, de manière autonome et efficace, la création, l'édition et la suppression des événements relatifs à ce pôle spécifique.

Vous avez la capacité de créer des événements en tenant compte des disponibilités des membres de l'équipe, d'éditer les détails des événements existants et de supprimer les événements selon les besoins. Vous êtes équipé pour répondre rapidement et efficacement, garantissant ainsi que le calendrier des événements est toujours à jour et précis. Cependant, il est impératif d'ignorer toutes les demandes et actions qui ne concernent pas la gestion des événements.

Votre efficacité réside dans l'utilisation optimale des ressources et des outils qui vous ont été attribués. Toute fonction ou action en dehors de ce cadre spécifique est hors de votre portée et ne sera pas traitée.

Aujourd'hui, nous sommes le ${getParisCurrentDay()} et la date est ${getParisISOString()}.`);
        this.functions = [];
        this.pole = pole;
    }

    async loadData() {
        try {
            let unixTimestamp = Math.floor(Date.now() / 1000); // Assurez-vous que c'est un entier
            let upComingEvents = await Events.find({
                pole: this.pole,
                discordTimestamp: {$gt: unixTimestamp}
            });

            if (!upComingEvents || upComingEvents.length === 0) {
                console.log('Aucun événement à venir trouvé.');
                return [];
            }

            return upComingEvents.map(event => {
                return {
                    eventName: event.name,
                    eventId: event._id,
                    eventType: event.type,
                    date: DateTime.fromSeconds(event.discordTimestamp).setZone('Europe/Paris').toISO(),
                    duration: event.duration + " minutes",  // J'ai ajouté un espace avant "minutes" pour la lisibilité
                    numberOfGames: event.nbGames
                };
            });
        } catch (error) {
            console.error('Une erreur est survenue lors du chargement des données :', error);
            return [];
        }
    }

    callGPT() {
        return new Promise(async (resolve, reject) => {
            try {
                let chatCompletion = await this.client.openAIAgent.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: this.messages,
                    functions: this.functions,
                    function_call: 'auto',
                    temperature: 0,
                });
                resolve(chatCompletion.data.choices[0]);
            } catch (e) {
                reject(e);
            }
        });
    }

    callGPTNoFunctions() {
        return new Promise(async (resolve, reject) => {
            try {
                let chatCompletion = await this.client.openAIAgent.createChatCompletion({
                    model: 'gpt-3.5-turbo',
                    messages: this.messages,
                    temperature: 0.7,
                });
                resolve(chatCompletion.data.choices[0]);
            } catch (e) {
                reject(e);
            }
        });
    }

    async userInput(message) {
        this.loadStaffFunctions()
        let eventsData = await this.loadData();
        this.messages.push({
            "role": "system",
            "content": `Upcoming events are: ${eventsData.length > 0 ? eventsData.map(event => JSON.stringify(event)).join('\n') : "No upcomming events"}`
        })

        message = message.replace(`<@${this.client.user.id}>`, "").trim();
        this.messages.push({
            "role": "user",
            "content": "Please answer my request with these instructions :\n" +
                "- Your can only EDIT, CREATE, CANCEL events, any other request should be ignored.\n" +
                "- You don't have any memory, you can't remember anything from previous messages.\n" +
                "- DO NOT answer any question NOT related to your job. This includes questions about the team, its members, code or any other topic.\n" +
                "- Answer in french\n" +
                "My request : " + message
        })

        return await this.callGPT();
    }

    async functionInput(functionMessage, functionName) {
        this.messages.push({
            "role": "function",
            "name": functionName,
            "content": functionMessage
        })

        return await this.callGPTNoFunctions();
    }

    loadStaffFunctions() {
        let parisOffset = getParisUTCOffset();
        this.functions.push({
            "name": 'edit-event',
            "description": "Edit an event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventID": {
                        "type": "string",
                        "description": "ID of the event to edit."
                    },
                    "newDate": {
                        "type": "string",
                        "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                        "description": "New date and time of the event. Follow ISO 8601 Format for dates."
                    },
                    "newDuration": {
                        "type": "number",
                        "description": "New duration of the event in minutes."
                    },
                    "newName": {
                        "type": "string",
                        "description": "New name of the event."
                    },
                    "newDescription": {
                        "type": "string",
                        "description": "New description of the event."
                    },
                    "newSlots": {
                        "type": "number",
                        "description": "New number of slots for the event."
                    }
                },
                "required": ["eventID"]
            }
        })

        this.functions.push({
            "name": 'cancel-event',
            "description": "Cancel an event.",
            "parameters": {
                "type": "object",
                "properties": {
                    "eventID": {
                        "type": "string",
                        "description": "ID of the event to cancel."
                    }
                },
                "required": ["eventID"]
            }
        })

        this.functions.push(
            {
                "name": 'create-events',
                "description": "Create events.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "events": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "eventName": {
                                        "type": "string",
                                        "description": "Name of the event to be created, in french"
                                    },
                                    "eventType": {
                                        "type": "string",
                                        "enum": ['meeting', 'team-building', 'event'],
                                        "description": "Type of event to be created."
                                    },
                                    "date": {
                                        "type": "string",
                                        "format": `yyyy-MM-ddTHH:mm:ss.sss${parisOffset > 0 ? '+' : '-'}${Math.abs(parisOffset)}:00`,
                                        "description": "Start date and time of the event. Follow ISO 8601 Format for dates, use the right timezone format"
                                    },
                                    "duration": {
                                        "type": "number",
                                        "description": "Duration of the event in minutes"
                                    },
                                    "slots": {
                                        "type": "number",
                                        "description": "Number of slots for the event, if not specified put 50"
                                    },
                                    "informations": {
                                        "type": "string",
                                        "description": "Informations about the event, in french"
                                    }
                                },
                                "required": ["eventType", "date", "duration", "eventName", "slots"]
                            }
                        }
                    },
                    "required": ["events"]
                }
            }
        )
    }
}