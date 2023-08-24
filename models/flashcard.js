const mongoose = require("mongoose");

const FlashCardSchema = new mongoose.Schema({
    userid: {
        type: String,
        required: true,
    },
    first_side: {
        type: String,
        required: true,
    },
    second_side: {
        type: String,
        required: true,
    },
});

module.exports = mongoose.model("FlashCard", FlashCardSchema);
