const express = require("express");
const app = express();
const mongoose = require("mongoose");
const asyncHandler = require("express-async-handler");
const bodyParser = require("body-parser");
const cors = require("cors");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const session = require("express-session");

const PORT = process.env.PORT | 5000;
require("dotenv").config();

const User = require("./models/user");
const TrackedTime = require("./models/trackedtime");
const FlashCard = require("./models/flashcard");
const FlashCardPack = require("./models/flashcardpack");
const Todo = require("./models/todo");

app.use(
    session({
        secret: "keyboard cat",
        resave: false,
        saveUninitialized: true,
        cookie: { secure: true },
    })
);

app.use(bodyParser.json());
app.use(cors());

app.use(express.urlencoded({ extended: false }));

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.post(
    "/timetracker",
    asyncHandler(async (req, res) => {
        const token = req.headers.authorization.split(" ")[1];
        const username = jwt.decode(token).username;
        const reqUser = await User.findOne({ username: username });
        await TrackedTime.create({
            userid: String(reqUser._id),
            time: req.body.time,
        });
        res.sendStatus(200);
    })
);

// app.get(
//     "/timetracker/users/:userid",
//     asyncHandler(async (req, res) => {
//         const trackedTimesList = await TrackedTime.find({
//             userid: req.params.userid,
//         });
//         res.send({
//             userid: req.params.id,
//             time_data_for_user: trackedTimesList,
//         });
//     })
// );

//create a flashcard pack
app.post(
    "/flashcards/packs/create",
    asyncHandler(async (req, res) => {
        const userId = await User.findOne({ username: req.body.username });
        await FlashCardPack.create({
            name: req.body.name,
            userid: userId._id,
            pack_state: req.body.pack_state,
        });
        res.sendStatus(200);
    })
);

//get the flashcardpacks of an user
//needs test!!
app.get(
    "/flashcards/packs/users/:username",
    asyncHandler(async (req, res) => {
        const reqUser = await User.findOne({
            username: req.params.username,
        });
        const flashCardsList = await FlashCardPack.find({
            userid: reqUser._id,
        });
        res.send({
            username: req.params.username,
            flashcard_packs_for_user: flashCardsList,
        });
    })
);

app.get(
    "/flashcards/packs/:packid",
    asyncHandler(async (req, res) => {
        const thePack = await FlashCardPack.findById(req.params.packid);
        res.send({
            pack: thePack,
        });
    })
);

app.put(
    "flashcards/packs/:packid",
    asyncHandler(async (req, res) => {
        await FlashCardPack.findOneAndUpdate(
            { _id: req.params.packid },
            {
                name: req.body.name,
                pack_state: req.body.pack_state,
            }
        );
        res.sendStatus(200);
    })
);

app.get(
    "/timetracker/stats/users/:username",
    asyncHandler(async (req, res) => {
        const userId = await User.findOne({ username: req.params.username });
        const trackedTimesForUser = await TrackedTime.find({
            userid: userId._id,
        });
        res.send({
            username: req.params.username,
            tracked_times_for_user: trackedTimesForUser,
        });
    })
);

//get todo items for user
app.post(
    "/todo/user",
    asyncHandler(async (req, res) => {
        const theTodo = await Todo.find({ username: req.body.username });
        if (theTodo === null) {
            res.send({
                todo_items: [],
            });
        } else {
            res.send({
                todo_items: theTodo,
            });
        }
    })
);

//add todo item
app.post(
    "/todo/",
    asyncHandler(async (req, res) => {
        await Todo.create({
            username: req.body.username,
            text: req.body.text,
        });
        res.sendStatus(200);
    })
);

//change status on todo item
app.put(
    "/todo/",
    asyncHandler(async (req, res) => {
        await Todo.updateOne(
            { _id: req.body.todo_item_id },
            { is_done: req.body.new_status }
        );
        res.sendStatus(200);
    })
);

//remove todo item
app.delete(
    "/todo/",
    asyncHandler(async (req, res) => {
        await Todo.deleteOne({ _id: req.body.todo_item_id });
        res.sendStatus(200);
    })
);

mongoose.set("strictQuery", false);
const mongoDB = process.env.MONGODB_URL;

async function main() {
    await mongoose.connect(mongoDB);
}

main()
    .then((err) => {
        if (!err) {
            console.log("Connected to db successfully!");
        }
    })
    .catch((err) => console.log(err));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function (id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

passport.use(
    new LocalStrategy(async (username, password, done) => {
        try {
            const user = await User.findOne({ username: username });
            if (!user) {
                return done(null, false, { message: "Incorrect username" });
            }
            bcryptjs.compare(password, user.password, (err, result) => {
                if (err) throw err;
                if (result === true) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        } catch (err) {
            return done(err);
        }
    })
);

app.post("/signup", bodyParser.json(), async (req, res) => {
    if (req.body.username === undefined || req.body.password === undefined) {
        res.send("No username or password given!");
    } else {
        const hashPassword = await bcryptjs.hash(req.body.password, 10);
        const newUser = new User({
            username: req.body.username,
            password: hashPassword,
            email: req.body.email,
        });
        await newUser.save();
        res.send("Sucess!!");
    }
});

app.post(
    "/login",
    bodyParser.json(),
    passport.authenticate("local"),
    (req, res) => {
        jwt.sign(
            { username: req.body.username, password: req.body.password },
            "secretKey",
            (err, token) => {
                res.json({
                    token,
                });
            }
        );
    }
);
