const express = require("express");

const {allMessages,sendMessage} = require("../controllers/messageControllers");
const {userRegisterValidator, userById} = require('../middlewares/user');




// import middlewares

const {verifyToken} = require('../middlewares/auth');

const router = express.Router();


router.get("/message/:chatId", verifyToken,userById, allMessages);
router.post("/message",verifyToken, userById,sendMessage);


module.exports = router;