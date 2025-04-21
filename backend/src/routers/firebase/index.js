const express = require("express")
const {asyncHandle} = require("../../helpers/asyncHandle");
const firebaseTokenController = require("../../controllers/firebaseToken.controller");
const router = express.Router();
router.post("/", asyncHandle(firebaseTokenController.upsertFirebaseToken))



module.exports = router