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

app.get(
    "/timetracker/users/:userid",
    asyncHandler(async (req, res) => {
        const trackedTimesList = await TrackedTime.find({
            userid: req.params.userid,
        });
        res.send({
            userid: req.params.id,
            time_data_for_user: trackedTimesList,
        });
    })
);

app.post(
    "/flashcards/create",
    asyncHandler(async (req, res) => {
        await FlashCard.create({
            userid: req.body.userid,
            first_side: req.body.first_side,
            second_side: req.body.second_side,
        });
    })
);

app.get(
    "/flashcards/users/:userid",
    asyncHandler(async (req, res) => {
        const flashCardsList = await TrackedTime.find({
            userid: req.params.userid,
        });
        res.send({
            userid: req.params.id,
            time_data_for_user: trackedTimesList,
        });
    })
);

app.get(
    "/timetracker/stats/users/:id",
    asyncHandler(async (req, res) => {
        const trackedTimesForUser = await TrackedTime.find({
            userid: req.params.id,
        });
        res.send({
            user_id: req.params.id,
            tracked_times_for_user: trackedTimesForUser,
        });
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
