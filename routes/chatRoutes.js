const express = require("express");
const {
  accessChat,
  fetchChats,
  createGroupChat,
  removeFromGroup,
  addToGroup,
  renameGroup,
} = require("../controllers/chatControllers");
const { verifyToken } = require("../middlewares/auth");
const {userById} = require('../middlewares/user');

const router = express.Router();

// router.get('/test', getTest);


router.post("/chat", verifyToken,userById,accessChat)
router.get("/chat", verifyToken, userById,fetchChats)
router.post("/group", verifyToken, userById, createGroupChat)
router.put("/rename", verifyToken, renameGroup)
router.put("/groupremove", verifyToken, removeFromGroup)
router.put("/groupadd", verifyToken, addToGroup)

module.exports = router;