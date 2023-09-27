const { Client } = require('@notionhq/client');
const {sleep} = require("./utilitaryFunctions");
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function createUserPage(userProperties) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.pages.create({
                "parent": {
                    "type": "database_id",
                    "database_id": "61e837d23b984835b9a35c01fb6f2529"
                },
                "icon": {
                    "type": "external",
                    "external": {
                        "url": userProperties.avatarURL
                    }
                },
                "properties": {
                    "Discord Tag": {
                        "title": [
                            {
                                "text": {
                                    "content": userProperties.discordTag
                                }
                            }
                        ]
                    },
                    "Discord ID": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": userProperties.discordId
                                }
                            }
                        ]
                    },
                    "Nom": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": userProperties.lastName
                                }
                            }
                        ]
                    },
                    "Prénom": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": userProperties.firstName
                                }
                            }
                        ]
                    },
                    "Twitter": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": userProperties.twitter
                                }
                            }
                        ]
                    },
                    "Pseudo IG": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": ""
                                }
                            }
                        ]
                    },
                    "Date de naissance": {
                        "type": "date",
                        "date": {
                            "start": userProperties.birthDate,
                            "end": null
                        }
                    },
                    "E-mail": {
                        "type": "email",
                        "email": userProperties.email
                    },
                    "Téléphone": {
                        "type": "phone_number",
                        "phone_number": userProperties.phone
                    },
                    "Ecole": {
                        "select": {
                            "name": userProperties.school
                        }
                    },
                    "Année": {
                        "select": {
                            "name": userProperties.schoolYear
                        }
                    },
                    "Role": {
                        "multi_select": userProperties.roles
                    }
                }
            });
        } catch (error) {
            console.log("Notion API Error while creating LDV User, retrying...")
            await sleep(50)
        }
    }
}

async function updateUserPage(pageId, userProperties) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.pages.update({
                "page_id": pageId,
                "icon": {
                    "type": "external",
                    "external": {
                        "url": userProperties.avatarURL
                    }
                },
                "properties": {
                    "Discord Tag": {
                        "title": [
                            {
                                "text": {
                                    "content": userProperties.discordTag
                                }
                            }
                        ]
                    },
                }
            });
        } catch (error) {
            console.log("Notion API Error while updating LDV User, retrying...")
            await sleep(50)
        }
    }
}

async function deletePage(pageId) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.blocks.delete({
                block_id: pageId,
            });
        } catch (error) {
            console.log("Notion API Error while deleting, retrying...")
            await sleep(50)
        }
    }
}

async function getNotionPageById(pageId) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.pages.retrieve({ page_id: pageId })
        } catch (error) {
            console.log("Notion API Error while fetching, retrying...")
            await sleep(50)
        }
    }
}

async function restorePage(pageId) {
    return await notion.pages.update({ page_id: pageId, archived: false })
}
async function queryDatabase(databaseId) {
    const database = await notion.databases.query({ database_id: databaseId })
    return database.results
}

async function getNotionPage(databaseId, filter) {
    const database = await notion.databases.query({ database_id: databaseId, filter: filter })
    return database.results[0]
}

async function queryDatabaseFilter(databaseId, filter) {
    const database = await notion.databases.query({ database_id: databaseId, filter: filter })
    return database.results
}

async function createSelectionUser(userProperties) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.pages.create({
                "parent": {
                    "type": "database_id",
                    "database_id": "fec4ef6d3b204c2b86a4c4cc2855d0e4"
                },
                icon: {
                    type: "external",
                    external: {
                        url: userProperties.avatarURL
                    }
                },
                "properties": {
                    "Discord Tag": {
                        "title": [
                            {
                                "text": {
                                    "content": userProperties.discordTag
                                }
                            }
                        ]
                    },
                    "Discord ID": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": userProperties.discordId
                                }
                            }
                        ]
                    },
                    "Etat": {
                        "select": {
                            "name": userProperties.state
                        }
                    },
                    "Server State": {
                        "select": {
                            "name": userProperties.serverState
                        }
                    },
                    "Pôles": {
                        "multi_select": userProperties.poles
                    },
                    "Jeu": {
                        "multi_select": userProperties.jeux
                    }
                }
            })
        } catch (error) {
            console.log("Notion API Error while creating, retrying...")
            await sleep(50)
        }
    }
}

async function updateSelectionUser(userPageId, userProperties) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.pages.update({
                archived: false,
                "page_id": userPageId,
                icon: {
                    type: "external",
                    external: {
                        url: userProperties.avatarURL
                    }
                },
                "properties": {
                    "Discord Tag": {
                        "title": [
                            {
                                "text": {
                                    "content": userProperties.discordTag
                                }
                            }
                        ]
                    },
                    "Etat": {
                        "select": {
                            "name": userProperties.state
                        }
                    },
                    "Server State": {
                        "select": {
                            "name": userProperties.serverState
                        }
                    },
                    "Pôles": {
                        "multi_select": userProperties.poles
                    },
                    "Jeu": {
                        "multi_select": userProperties.jeux
                    }
                }
            })
        } catch (error) {
            console.log("Notion API Error while updating, retrying...")
            await sleep(50)
        }
    }
}

async function selectionUserSwitch(pageId) {
    for (let i = 0; i < 2; i++) {
        try {
            return await notion.pages.update({
                "page_id": pageId,
                "properties": {
                    "Server State": {
                        "select": {
                            "name": "Switched"
                        }
                    }
                }
            })
        } catch (error) {
            console.log("Notion API Error while updating, retrying...")
            await sleep(50)
        }
    }
}



module.exports = {
    createUserPage,
    queryDatabase,
    createSelectionUser,
    updateSelectionUser,
    getNotionPage,
    queryDatabaseFilter,
    deletePage,
    selectionUserSwitch,
    getNotionPageById,
    updateUserPage,
    restorePage
}