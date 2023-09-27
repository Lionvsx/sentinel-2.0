
module.exports = class OpenAIInterface {
    constructor(client, systemPrompt) {
        this.messages = [
            {
                "role": "system",
                "content": systemPrompt
            }
        ];
        this.client = client;
    }

    callGPT(model, functions, prompt) {
        return new Promise(async (resolve, reject) => {
            this.messages.push({role: "user", content: prompt});
            try {
                let chatCompletion = await this.client.openAIAgent.createChatCompletion({
                    model: model,
                    messages: this.messages,
                    functions: functions,
                    function_call: 'auto',
                });
                resolve(chatCompletion.data.choices[0]);
            } catch (e) {
                reject(e);
            }
        });
    }


}