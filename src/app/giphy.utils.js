import Cookies from "js-cookie";
import ChatScreen from "./chat.screen";
import io from "socket.io-client";
import React, { Component } from "react";
import popSoundSrc from "../assets/notification.mp3";
import axios from "axios";

const get_user = Cookies.get("giphy_user");

export default class GiphyUtils extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      users: [],
      typers: [],
      loading: true,
      whatIsLoading: 0,
      user: get_user,
    };
  }

  // Initialize the audio here

  audio = new Audio(popSoundSrc);

  // Scroll down to the last message
  // Always make sure the window is scrolled down to the last message.
  scrollToBottom = () => {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
  };

  connectServer = () => {
    this.setState({ whatIsLoading: 2 });

    this.socket = io("https://yacht-socket.herokuapp.com/");

    // How many users are in our socket?
    this.socket.on("users", (res) => {
      this.setState({ users: res.users }, this.scrollToBottom);
    });

    // Who and who is typing
    this.socket.on("typers", (res) => {
      this.setState({ typers: res.typers });
    });

    // Load the last 10 messages in the window.
    this.socket.on("init", (msg) => {
      let msgReversed = msg.reverse();
      this.setState(
        (state) => ({
          messages: [...state.messages, ...msgReversed],
          loading: false,
          whatIsLoading: 0,
        }),
        this.scrollToBottom
      );
    });

    // Update the chat if a new message is broadcasted.
    this.socket.on("push", (msg) => {
      const incomingMessage = {
        ...msg,
        ownedByCurrentUser: msg.sender_id === "dddd",
      };
      this.setState(
        (state) => ({
          messages: [...state.messages, incomingMessage],
        }),
        this.scrollToBottom
      );
      // Play the sound once message is broadcasted
      if (this.audio.muted) {
        this.audio.muted = false;
      }
      if (!incomingMessage.ownedByCurrentUser) {
        this.audio.play();
      }
    });
  };

  componentDidMount() {
    //Generate a random 3 numbers
    function makeId(length) {
      var result = "";
      var characters = "0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * charactersLength)
        );
      }
      return result;
    }

    let number = makeId(3);

    // Check if user exist or not and connect to server no matter what
    if (!get_user) {
      this.setState({ whatIsLoading: 1 });
      axios
        .get("https://random-word-api.herokuapp.com/word?number=1")
        .then((res) => {
          Cookies.remove("giphy_user");
          Cookies.set("giphy_user", res.data[0] + "_" + number);
          const new_user = Cookies.get("giphy_user");
          this.setState({ user: new_user });
          this.connectServer();
        })
        .catch((err) => console.log(err));
    } else {
      this.connectServer();
    }
  }

  // Tell the server that someone is typing
  startTyping = async () => {
    this.socket.emit("start_typing", {
      user: this.state.user,
    });
  };

  // Tell the server that the person is not typing again
  stopTyping = async () => {
    this.socket.emit("stop_typing", {
      user: this.state.user,
    });
  };

  // Sends a message to the server that
  // forwards it to all users in the same room
  sendMessage = async (message, blob) => {
    const formData = new FormData();
    formData.append("file", blob);
    // replace this with your upload preset name
    formData.append("upload_preset", "zrhqsswu");
    const options = {
      method: "POST",
      body: formData,
    };

    // replace cloudname with your Cloudinary cloud_name
    try {
      const res = await fetch(
        "https://api.Cloudinary.com/v1_1/digital-specie/video/upload",
        options
      );
      const res_1 = await res.json();
      this.setState((state) => {
        // Update the chat with the user's message and remove the current message.
        return {
          messages: [
            ...state.messages,
            {
              gif: res_1.public_id,
              message: message,
              sender_id: this.socket.id,
              sender_name: this.state.user,
            },
          ],
        };
      }, this.scrollToBottom);
      this.socket.emit("message", {
        gif: res_1.public_id,
        message: message,
        sender_id: this.socket.id,
        sender_name: this.state.user,
      });
    } catch (err) {
      return console.log(err);
    }
  };

  render() {
    const { messages, users, loading, whatIsLoading, typers } = this.state;
    return (
      <ChatScreen
        messages={messages}
        sendMessage={this.sendMessage}
        startTyping={this.startTyping}
        stopTyping={this.stopTyping}
        users={users}
        loading={loading}
        typers={typers}
        whatIsLoading={whatIsLoading}
      />
    );
  }
}
