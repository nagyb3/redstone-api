const mongoose = require("mongoose");

const TodoSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    is_done: {
        type: Boolean,
        default: false,
    },
});

module.exports = mongoose.model("Todo", TodoSchema);
