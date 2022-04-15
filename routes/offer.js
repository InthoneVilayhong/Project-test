const express = require("express");
const router = express.Router();

const cloudinary = require("cloudinary").v2;
const identification = require("../identification");

const User = require("../models/User");
const Offer = require("../models/Offer");

//************************ ROUTE /offer/publish Pour publier une offre ******************/

router.post("/offer/publish", identification, async (req, res) => {
    console.log("Route actuel /offer/publish");
    // console.log(req.headers);
    // console.log(req.files.picture);
    const user = await User.findOne({
        token: req.headers.authorization.replace("Bearer ", ""),
    });
    // console.log(user);
    try {
        if (req.fields.description.length < 500) {
            if (req.fields.title.length < 50) {
                if (req.fields.price < 100000) {
                    //! Creation de l'offer avec les fields renseignées
                    const newOffer = await new Offer({
                        product_name: req.fields.title,
                        product_description: req.fields.description,
                        product_price: req.fields.price,
                        product_details: [
                            {
                                condition: req.fields.condition,
                                city: req.fields.city,
                                brand: req.fields.brand,
                                size: req.fields.size,
                                color: req.fields.color,
                            },
                        ],
                        owner: user,
                    });
                    // console.log(newOffer);
                    //! Upload dans un chemin specifique avec en titre l'id de l'offre on l'upload et on recupere le lien securiser
                    let pictureToUpload = req.files.picture.path;
                    const result = await cloudinary.uploader.upload(
                        pictureToUpload,
                        {
                            public_id: `vinted/offers/${newOffer.id}`,
                        }
                    );
                    const pictureLinkSecure = result.secure_url;

                    //! On met a la newOffer l'image secure url uploader
                    newOffer.product_image = pictureLinkSecure;

                    newOffer.save();
                    // console.log(newOffer.owner.account.username);
                    res.json({
                        product_name: req.fields.title,
                        product_description: req.fields.description,
                        product_price: req.fields.price,
                        product_details: [
                            {
                                condition: req.fields.condition,
                                city: req.fields.city,
                                brand: req.fields.brand,
                                size: req.fields.size,
                                color: req.fields.color,
                            },
                        ],
                        owner: {
                            account: {
                                username: newOffer.owner.account.username,
                            },
                        },
                        product_image: { secure_url: pictureLinkSecure },
                    });
                } else {
                    res.status(400).json("Price must be under 100000");
                }
            } else {
                res.status(400).json("Title characters must be under 50");
            }
        } else {
            res.status(400).json("Description characters must be under 500");
        }
    } catch (error) {
        res.status(400).json(error.message);
    }
});

//************************ ROUTE /offer/delete Pour supprimer une offre ******************/

router.delete("/offer/delete", identification, async (req, res) => {
    console.log(req.fields.id);
    try {
        //! On cherche et delete l'offre
        if (req.fields.id) {
            await Offer.findByIdAndDelete(req.fields.id);
            res.json("Offer deleted");
        } else {
            res.status(400).json("Missing id");
        }
    } catch (error) {
        res.status(400).json(error.message);
    }
});

//************************ ROUTE /offer/update Pour update une offre ******************/

router.put("/offer/update", identification, async (req, res) => {
    // console.log(req.fields);
    try {
        const offerToUpdate = await Offer.findById(req.fields.id);
        //! On trouve l'offre a update
        // console.log(offerToUpdate.product_image);

        let newPictureToUpload = req.files.picture.path;
        const newResult = await cloudinary.uploader.upload(newPictureToUpload, {
            public_id: `vinted/offers/${offerToUpdate.id}`,
        });
        const newPictureLinkSecure = newResult.secure_url;

        // console.log("Ancien ==>", offerToUpdate.product_image); //!l'ancienne secure url de la photo
        // console.log("Nouveau ===>", newPictureLinkSecure); //! la nouvelle secure url de la photo

        if (req.fields.product_name) {
            offerToUpdate.product_name = req.fields.product_name;
        }
        if (req.fields.product_description) {
            offerToUpdate.product_description = req.fields.product_description;
        }

        if (req.fields.product_price) {
            offerToUpdate.product_price = req.fields.product_price;
        }
        if (req.files.picture) {
            offerToUpdate.product_image = newPictureLinkSecure;
        }

        if (req.fields.condition) {
            offerToUpdate.product_details[0].condition = req.fields.condition;
        }
        if (req.fields.city) {
            offerToUpdate.product_details[0].city = req.fields.city;
        }
        if (req.fields.brand) {
            offerToUpdate.product_details[0].brand = req.fields.brand;
        }
        if (req.fields.size) {
            offerToUpdate.product_details[0].size = req.fields.size;
        }
        if (req.fields.color) {
            offerToUpdate.product_details[0].color = req.fields.color;
        }
        // console.log(offerToUpdate.product_image.secure_url);

        offerToUpdate.save();
        console.log(offerToUpdate);
        res.json({
            message: "Offer updated",
            product_name: offerToUpdate.product_name,
            product_description: offerToUpdate.product_description,
            product_price: offerToUpdate.product_price,
            product_details: [
                {
                    condition: offerToUpdate.product_details[0].condition,
                    city: offerToUpdate.product_details[0].city,
                    brand: offerToUpdate.product_details[0].brand,
                    size: offerToUpdate.product_details[0].size,
                    color: offerToUpdate.product_details[0].color,
                },
            ],

            product_image: { secure_url: offerToUpdate.product_image },
        });
    } catch (error) {
        res.status(400).json(error.message);
    }
});

//************************ ROUTE /offer/ ******************/

router.get("/offers", identification, async (req, res) => {
    console.log("/offers");
    console.log(req.query);
    try {
        if (req.query.title && req.query.sort === "price-asc") {
            const offerToShow = await Offer.find({
                product_name: req.query.title,
            }).sort({ product_price: 1 });
            res.json(offerToShow);
        } else if (req.query.title && req.query.sort === "price-desc") {
            const offerToShow = await Offer.find({
                product_name: req.query.title,
            }).sort({ product_price: -1 });
            res.json(offerToShow);
        } else if (req.query.title) {
            const offerToShow = await Offer.find({
                product_name: req.query.title,
            });
            res.json(offerToShow);
        } else if (req.query.page === "1") {
            const offerToShow = await Offer.find().limit(2);
            res.json(offerToShow);
        } else if (req.query.page && req.query.page !== "1") {
            let toSkip = Number(req.query.page) - 1;
            console.log(toSkip);
            const offerToShow = await Offer.find()
                .limit(2)
                .skip(2 * toSkip);
            res.json(offerToShow);
        } else if (req.query.priceMax) {
            const offerToShow = await Offer.find({
                product_price: { $lte: req.query.priceMax },
            });
            res.json(offerToShow);
        } else if (req.query.priceMin) {
            const offerToShow = await Offer.find({
                product_price: { $gte: req.query.priceMin },
            });
            res.json(offerToShow);
        } else if (req.query.title && req.query.priceMax) {
            const offerToShow = await Offer.find({
                title: req.query.title,
                price: { $lte: req.query.priceMax },
            });
            res.json(offerToShow);
        } else if (req.query.priceMin && req.query.priceMax) {
            const offerToShow = await Offer.find({
                product_price: {
                    $lte: Number(req.query.priceMax),
                    $gte: Number(req.query.priceMin),
                },
            });
            res.json(offerToShow);
        } else if (req.query.sort === "price-desc") {
            const offerToShow = await Offer.find().sort({ product_price: -1 });
            res.json(offerToShow);
        } else if (req.query.sort === "price-asc") {
            const offerToShow = await Offer.find().sort({ product_price: 1 });
            res.json(offerToShow);
        } else {
            const offerToShow = await Offer.find().limit(2);
            res.json(offerToShow);
        }
    } catch (error) {
        res.status(400).json(error.message);
    }
});

//************************ ROUTE /offer/:id ******************/

router.get("/offer/:id", identification, async (req, res) => {
    console.log(req.params); //! en mode params
    try {
        const offerToShow = await Offer.find({ _id: req.params.id }); //! on recherche le bon id
        res.json(offerToShow);
    } catch (error) {
        res.json(error.message);
    }
});

module.exports = router;
