const express = require("express");
const router = express.Router();

const stripeController = require("../controllers/stripeController");
const imageController = require("../controllers/insertimage");

router.post("/create-checkout-session", stripeController.createPaymentSession);
router.post("/insert_image", imageController.insertimage);
// router.post("/update_image", imageController.updateimage);
// router.post("/remove_image", imageController.removeimage);

module.exports = router;
