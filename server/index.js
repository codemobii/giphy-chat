const express = require("express");
const app = express();
const http = require("http").Server(app);
const path = require("path");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const io = require("socket.io")(http, {
  cors: {
    origin: "*",
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

// enable CORS
app.use(cors());
// parse application/json
app.use(bodyParser.json());
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// serving static files
app.use("/uploads", express.static("uploads"));

// handle storage using multer
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});
var upload = multer({ storage: storage });

// handle single file upload
app.post("/upload", upload.single("dataFile"), (req, res, next) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send({ message: "Please upload a file." });
  }
  return res.send({ message: "File uploaded successfully.", file });
});

// request handlers
app.get("/", (req, res) => {
  res.send("Giphy Chat Server is running successfully");
});
