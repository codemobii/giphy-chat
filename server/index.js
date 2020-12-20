const express = require("express");
const app = express();
const http = require("http").Server(app);
const path = require("path");
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});
const { MONGODB_URI } = require("./config");

const port = process.env.PORT || 8000;

const Message = require("./message_model");
const mongoose = require("mongoose");

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((result) => {
    http.listen(port, () => {
      console.log(`Listening on port ${port}...`);
    });
  })
  .catch((err) => {
    // Handle error
    console.log(err);
  });

app.use(express.static(path.join(__dirname, "..", "client", "build")));

const users = [];

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

// Working on file uploads

// request handlers
app.get("/", (req, res) => {
  res.send("Giphy Chat Server is running successfully");
});
