const asyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/user");
const Chat = require("../models/chatModel");

//@description     Get all Messages
//@route           GET /api/Message/:chatId
//@access          Protected
const allMessages = asyncHandler(async (req, res) => {
    //console.log("req.params::",req.params.chatId)
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .populate("chat");
    //console.log("Messages:", messages)
    res.json(messages);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

//@description     Create New Message
//@route           POST /api/Message/
//@access          Protected
const sendMessage = asyncHandler(async (req, res) => {
  const { content, chatId } = req.body;
  //console.log("req.body:",req.body)
  if (!content || !chatId) {
    console.log("Invalid data passed into request");
    return res.sendStatus(400);
  }

  var newMessage = {
    sender: req.user._id,
    content: content,
    chat: chatId,
  };

  try {
    var message = await Message.create(newMessage);

    message = await message.populate("sender", "name pic")//.execPopulate();
    message = await message.populate("chat")//.execPopulate();
    message = await User.populate(message, {
      path: "chat.users",
      select: "name pic email",
    });
    // console.log("MessageBack", message.chat.users)
    await Chat.findByIdAndUpdate(req.body.chatId, { latestMessage: message });
    //console.log("Message Back:::::", message)
    res.json(message);
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

module.exports = { allMessages, sendMessage };