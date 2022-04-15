const express = require("express");
const router = express.Router();
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const cloudinary = require("cloudinary").v2;

const User = require("../models/User"); //! import du model

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
});

//************************ ROUTE /user/signup Pour signup un nouvel user ******************/
router.post("/user/signup", async (req, res) => {
    // console.log("route /user/signup");
    // console.log(req.fields);
    try {
        //! Creation a partir du password de la requete un salt puis un hash et ensuite un token unique
        const passwordUser = req.fields.password;
        const saltUser = uid2(16);
        const hashUser = SHA256(passwordUser + saltUser).toString(encBase64);
        const tokenUser = uid2(16);

        //! Deux conditions on verifie d'abord si l'username est bien renseigné et ensuite si l'email existe
        const emailExist = await User.findOne({ email: req.fields.email });

        if (req.fields.username) {
            if (emailExist === null) {
                const newUser = new User({
                    email: req.fields.email,

                    account: {
                        username: req.fields.username,
                    },
                    // nous verrons plus tard comment uploader une image

                    newsletter: req.fields.newsletter,
                    token: tokenUser,
                    hash: hashUser,
                    salt: saltUser,
                });
                //! On vient de créer un User et on save
                const pictureToUpload = req.files.picture.path;
                const result = await cloudinary.uploader.upload(
                    pictureToUpload,
                    {
                        public_id: `vinted/users/${req.fields.username}`,
                    }
                );
                const pictureLinkSecure = await result.secure_url;

                newUser.avatar = pictureLinkSecure;

                await newUser.save();
                res.status(200).json({
                    _id: newUser.id,
                    token: tokenUser,
                    account: {
                        username: req.fields.username,
                    },
                });
            } else {
                res.status(400).json({ message: "User already exist" });
            }
        } else {
            res.status(400).json({ message: "Please indicate your username" });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ********************** ROUTE /user/login Pour login un user **************** /

router.post("/user/login", async (req, res) => {
    console.log("route : /user/login");
    console.log(req.fields);
    try {
        //! On recherche l'user par l'email renseigné et on  retourne une reponse avec le id le token et l'username
        const userToLog = await User.findOne({ email: req.fields.email });

        //!! on le met en hash avec le salt de l'user en question
        //! On test si c'est égale au hash de la BD si c ok c'est que c'est le bon password
        if (userToLog) {
            const passwordUser = req.fields.password; //!password renseigné
            const hashUser = SHA256(passwordUser + userToLog.salt).toString(
                encBase64
            );
            if (hashUser === userToLog.hash) {
                res.json({
                    _id: userToLog._id,
                    token: userToLog.token,
                    account: {
                        username: userToLog.account.username,
                    },
                });
            } else {
                res.status(400).json("unhautorized !(passwotd) ");
            }
        } else {
            res.status(400).json("unhautorized !(email)");
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

//! Jamais oublier l'exports
module.exports = router;
