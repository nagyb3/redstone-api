const mongoose = require("mongoose");

const TrackedTimeSchema = new mongoose.Schema({
    time: {
        type: Number,
        required: true,
    },
    userid: {
        type: String,
        required: true,
    },
    creation_date: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model("TrackedTime", TrackedTimeSchema);
