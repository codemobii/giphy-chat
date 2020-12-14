import { useEffect, useRef, useState } from "react";
import socketIOClient, { Socket } from "socket.io-client";

const AppUtils = () => {
  const [messages, setMessages] = useState([]); // Sent and received messages
  const [users, setUsers] = useState([]);
  const [fetching, setFetching] = useState(true); // Fetching state

  // Always make sure the window is scrolled down to the last message.
  const scrollToBottom = () => {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
  };

  let socket = socketIOClient("http://localhost:8000/");

  useEffect(() => {
    // How many users are in our socket?
    socket.on("users", (msg) => {
      setUsers(msg.users);
    });

    // Load the last 10 messages in the window.
    socket.on("init", (msg) => {
      let msgReversed = msg.reverse();

      setMessages((messages) => [...messages, msgReversed]);
      setFetching(false);
      scrollToBottom();
    });

    // Update the chat if a new message is broadcasted.
    socket.on("push", (msg) => {
      setMessages((messages) => [...messages, msg]);
      setFetching(false);
      scrollToBottom();
    });
    return () => socket.disconnect();
  }, [socket]);

  // Sends a message to the server that
  // forwards it to all users in the same room
  const sendMessage = (name, content) => {
    socket.emit("message", {
      name: name,
      content: content,
    });
    scrollToBottom();
  };

  return { messages, sendMessage, users, fetching };
};

export default AppUtils;
