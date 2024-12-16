// import modules
const express = require('express');
const {json, urlencoded} = express;
const mongoose = require('mongoose');
const morgan = require('morgan');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require("cookie-parser");
const expressValidator = require("express-validator");
const path = require('path');

// app
const app = express();

// db
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log("DB Connectecd")).catch((err) => console.log("DB CONNECTION ERROR", err));

// middleware
app.use(morgan("dev"));
app.use(cors({origin: true, credentials: true}));
app.use(json());
app.use(urlencoded({extended: false}));
app.use(cookieParser());
app.use(expressValidator());

// routes
const testRoutes = require('./routes/test');
app.use("/", testRoutes);

const userRoutes = require("./routes/user");
app.use("/", userRoutes);

const chatRoutes = require("./routes/chatRoutes");
app.use("/", chatRoutes);

const messageRoutes = require("./routes/messageRoutes");
app.use("/", messageRoutes);

// ---------------------------------Deployment--------------------------------

const __dirname1 = path.resolve();
if(process.env.NODE_ENV === 'production'){

    app.use(express.static(path.join(__dirname1,"/client/build")));

    app.get("*",(req,res) => {
        res.sendFile(path.resolve(__dirname1,"client","build","index.html"));
    })
} else {
    app.get("/", (req,res) => {
        res.send("API is running successfully")
    })
}

// ---------------------------------Deployment--------------------------------


// port
const port = process.env.PORT || 8080;

// listener
const server = app.listen(port, () => console.log(`Server is running on port ${port}`));

const io = require("socket.io")(server, {
    pingTimeout: 60000,
    cors: {
      origin: process.env.REACT_APP_API_URL,
      // credentials: true,
    },
  });



io.on("connection", async (socket) => {
    console.log("Connected to socket.io");
    
    socket.on("setup", (userData) => {
        
        console.log("userdata::::", userData)
        socket.join(userData);//._id);
        
      
      //console.log(userData)
      socket.emit("connected");
    });
  

    // make a room with chatID. Users will join that room to chat.
    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User Joined Room: " + room);
    });
    socket.on("typing", (room) => socket.in(room).emit("typing"));
    socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));
  
    socket.on("new message", (newMessageRecieved) => {
      var chat = newMessageRecieved.chat;
      
    //   console.log("user:::::", chat)
    //   console.log("socket: New message:::::", newMessageRecieved)
  
      if (!chat.users) return console.log("chat.users not defined");
  
      chat.users.forEach((user) => {
        // console.log("user!!!!", user)
        // console.log("newMessageRecieved.sender!!!!!!",newMessageRecieved.sender)
          
        if (user._id === newMessageRecieved.sender._id) return;
        console.log("before if condition!!!!!!!!!!", user)
        socket.in(user._id).emit("message recieved", newMessageRecieved);
      });
    });
  
    // socket.off("setup", () => {
    //   console.log("USER DISCONNECTED");
    //   socket.leave(userData._id);
    // });
  });