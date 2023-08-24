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
    pack_state: {
        type: Array,
        required: true,
    },
});

module.exports = mongoose.model("FlashCardPack", FlashCardPackSchema);
