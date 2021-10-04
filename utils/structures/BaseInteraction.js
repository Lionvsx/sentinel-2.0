module.exports = class BaseInteraction {
    constructor(name, category, type, help) {
        this.name = name;
        this.category = category;
        this.type = type;
        this.help = help;
    }
}