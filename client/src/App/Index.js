/* eslint-disable */
import React, { Component } from "react";
import io from "socket.io-client";
import TimeAgo from "react-timeago";
import Axios from "axios";

function log(msg) {
  logElement.innerHTML += msg + "\n";
}
function wait(delayInMS) {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

export default class Home extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chat: [],
      content: "",
      name: "hello",
      users: [],
      loading: false,
    };
  }

  startRecording = async (stream, lengthInMS) => {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = (event) => data.push(event.data);
    recorder.start();

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = (event) => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(
      () => recorder.state == "recording" && recorder.stop()
    );

    await Promise.all([stopped, recorded]);
    return data;
  };

  componentDidMount() {
    this.socket = io("http://localhost:8000");

    // How many users are in our socket?
    this.socket.on("users", (msg) => {
      this.setState({ users: msg.users });
    });

    // Load the last 10 messages in the window.
    this.socket.on("init", (msg) => {
      let msgReversed = msg.reverse();
      this.setState(
        (state) => ({
          chat: [...state.chat, ...msgReversed],
        }),
        this.scrollToBottom
      );
      console.log(msg);
    });

    // Update the chat if a new message is broadcasted.
    this.socket.on("push", (msg) => {
      this.setState(
        (state) => ({
          chat: [...state.chat, msg],
        }),
        this.scrollToBottom
      );
    });

    // Set recorder on load

    let preview = document.getElementById("preview");
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        preview.srcObject = stream;
        preview.captureStream =
          preview.captureStream || preview.mozCaptureStream;
        return new Promise((resolve) => (preview.onplaying = resolve));
      })
      .catch((err) => console.log(err));
  }

  // Save the message the user is typing in the input field.
  handleContent(event) {
    this.setState({
      content: event.target.value,
    });
  }

  //
  handleName(event) {
    this.setState({
      name: event.target.value,
    });
  }

  handleSubmit(event) {
    // Prevent the form to reload the current page.
    event.preventDefault();
  }

  // Always make sure the window is scrolled down to the last message.
  scrollToBottom() {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
  }

  record = () => {
    let preview = document.getElementById("preview");
    let recording = document.getElementById("recording");

    this.setState({ loading: true });

    let recordingTimeMS = 2000;
    navigator.mediaDevices
      .getUserMedia({
        video: true,
        audio: true,
      })
      .then((stream) => {
        preview.srcObject = stream;
        preview.captureStream =
          preview.captureStream || preview.mozCaptureStream;
        return new Promise((resolve) => (preview.onplaying = resolve));
      })
      .then(() => this.startRecording(preview.captureStream(), recordingTimeMS))
      .then(async (recordedChunks) => {
        let recordedBlob = new Blob(recordedChunks, {
          type: "video/webm",
        });
        recording.src = URL.createObjectURL(recordedBlob);
        this.setState({ name: recording.src });

        // Send the new message to the server.
        this.socket.emit("message", {
          name: this.state.name,
          content: this.state.content,
        });

        this.setState((state) => {
          // Update the chat with the user's message and remove the current message.
          return {
            chat: [
              ...state.chat,
              {
                name: state.name,
                content: state.content,
              },
            ],
            content: "",
            loading: false,
          };
        }, this.scrollToBottom);
        this.sendVideoToAPI(recordedBlob);
      })
      .catch((err) => console.log(err));
  };

  // Send video blob to server

  sendVideoToAPI = async (blob) => {
    const formData = new FormData();
    formData.append("dataFile", blob);
    console.log(blob);
    Axios({
      method: "post",
      url: "http://localhost:8000/upload",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Access-Control-Allow-Origin": "*",
      },
      data: {
        file: blob,
      },
    })
      .then((response) => {
        console.log(response);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  render() {
    const { chat, content, users, loading } = this.state;

    return (
      <div className="chat-room-container">
        <video
          style={{ display: "none" }}
          id="recording"
          width="160"
          height="120"
          autoPlay
          loop
          muted
        ></video>
        <h1 className="room-name">Room: {users.length}</h1>
        <div id="chat" className="messages-container">
          <ol className="messages-list">
            {chat.map((message, i) => (
              <li key={i} className={`message-item received-message`}>
                <video
                  src={message.name}
                  id="recording"
                  width="160"
                  height="120"
                  autoPlay
                  loop
                  muted
                  playbackRate={2}
                ></video>
                {message.content}
                <span style={{ display: "block", fontSize: 10, marginTop: 10 }}>
                  <TimeAgo date={message.createdAt} />
                </span>
              </li>
            ))}
          </ol>
        </div>
        <div>
          <video id="preview" width="160" height="120" autoPlay muted></video>
          <textarea
            value={content}
            onChange={this.handleContent.bind(this)}
            placeholder="Write message..."
            className="new-message-input-field"
          />
        </div>
        <button onClick={this.record} className="send-message-button">
          {loading ? "Sending ..." : "Send"}
        </button>
      </div>
    );
  }
}
