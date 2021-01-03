const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: ["http://localhost:3000", "https://giphy-chat.vercel.app"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});
const cors = require("cors");

// Configuring the database and message model
const dbConfig = require("./config");
const Message = require("./message_model");
const mongoose = require("mongoose");

// Call a user array (To store number of users connected)
const users = [];

app.use(cors());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// parse requests of content-type - application/json
app.use(bodyParser.json());

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  next();
});

mongoose.Promise = global.Promise;

// Connecting to the database
mongoose
  .connect(dbConfig.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.log("Could not connect to the database. Exiting now...", err);
    process.exit();
  });

// listen for requests
server.listen(8000, () => {
  console.log("Server is listening on port 5000");
});

// define a simple route
app.get("/", (req, res) => {
  res.json({
    message: "Giphy Chat Server is Running",
    time: new Date().toString(),
  });
});

io.on("connection", (socket) => {
  // Get users
  users.push({ id: socket.id });
  io.emit("users", { users: users });

  // Get the last 10 messages from the database.
  Message.find()
    .sort({ createdAt: -1 })
    .limit(10)
    .exec((err, messages) => {
      if (err) return console.error(err);

      // Send the last messages to the user.
      socket.emit("init", messages);
    });

  // Listen to connected users for a new message.
  socket.on("message", (msg) => {
    // Create a message with the content and the name of the user.
    const message = new Message({
      content: msg.content,
      name: msg.name,
    });

    // Save the message to the database.
    message.save((err) => {
      if (err) return console.error(err);
    });

    // Notify all other users about a new message.
    socket.broadcast.emit("push", msg);
  });

  socket.on("disconnect", (reason) => {
    // Remove user
    let index = -1;
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      if (user.id === socket.id) {
        index = i;
      }
    }
    // Remove user
    if (index !== -1) {
      users.splice(index, 1);
    }
    io.emit("users", { users: users });
  });
});
