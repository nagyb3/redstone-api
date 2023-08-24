const mongoose = require("mongoose");

const FlashCardPackSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    flashcard_ids: {
        type: Array,
        default: [],
    },
});

module.exports = mongoose.model("FlashCardPack", FlashCardPackSchema);
