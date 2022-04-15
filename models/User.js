const mongoose = require("mongoose");

const User = mongoose.model("User", {
    email: {
        unique: true,
        type: String,
    },
    account: {
        username: {
            required: true,
            type: String,
        },
        avatar: { type: mongoose.Schema.Types.Mixed, default: {} }, // nous verrons plus tard comment uploader une image
    },
    newsletter: Boolean,
    token: String,
    hash: String,
    salt: String,
});

module.exports = User;
