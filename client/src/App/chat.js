/* eslint-disable */
import React, { Component, useRef } from "react";
import io from "socket.io-client";
import Fadeloader from "react-spinners/FadeLoader";
import TimeAgo from "timeago-react";

function log(msg) {
  logElement.innerHTML += msg + "\n";
}
function wait(delayInMS) {
  return new Promise((resolve) => setTimeout(resolve, delayInMS));
}

export default class Chat extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chat: [],
      content: "",
      name: "hello",
      users: [],
      loading: false,
      setPlayBack: props.setPlayBack,
      videoRef: props.videoRef,
      show: false,
      fetching: true,
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
    this.socket = io("https://giphy-chat-server.vercel.app/");

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
          fetching: false,
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
    if (this.state.content.length < 100) {
      this.setState({
        content: event.target.value,
      });
    }
  }

  // Always make sure the window is scrolled down to the last message.
  scrollToBottom() {
    const chat = document.getElementById("chat");
    chat.scrollTop = chat.scrollHeight;
  }

  record = () => {
    let preview = document.getElementById("preview");
    let recording = document.getElementById("recording");

    this.setState({ show: true });

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
        this.setState({ show: false, loading: true });
        let recordedBlob = new Blob(recordedChunks, {
          type: "video/webm",
        });
        recording.src = URL.createObjectURL(recordedBlob);

        this.sendMessage(recordedBlob);
      })
      .catch((err) => console.log(err));
  };

  // Send video blob to server

  sendMessage = async (blob) => {
    console.log("Image file", blob);
    const formData = new FormData();
    formData.append("file", blob);
    // replace this with your upload preset name
    formData.append("upload_preset", "zrhqsswu");
    const options = {
      method: "POST",
      body: formData,
    };

    // replace cloudname with your Cloudinary cloud_name
    return fetch(
      "https://api.Cloudinary.com/v1_1/digital-specie/video/upload",
      options
    )
      .then((res) => res.json())
      .then((res) => {
        console.log(res);
        this.setState({ name: res.public_id });

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
      })
      .catch((err) => console.log(err));
  };

  render() {
    const {
      chat,
      content,
      users,
      loading,
      videoRef,
      setPlayBack,
      show,
      fetching,
    } = this.state;

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
        <div className="header">
          <div className="logo">
            <span>💬</span>Giphy Chat
          </div>
          <div className="side_items">
            <iframe
              src="https://ghbtns.com/github-btn.html?user=ijelechimaobi&repo=giphy-chat&type=star&count=true"
              frameborder="0"
              scrolling="0"
              width="130"
              height="20"
              title="GitHub"
            ></iframe>
            <div className="active_users">{users.length}</div>
          </div>
        </div>
        {fetching ? (
          <div id="chat" className="messages-container">
            <div className="loading_cont">
              <Fadeloader size={32} color={"#31a24c"} loading={true} />
            </div>
          </div>
        ) : (
          <div id="chat" className="messages-container">
            <ol className="messages-list">
              {chat.map((message, i) => (
                <li key={i} className={`message-item received-message`}>
                  <img
                    style={{ width: "140px", height: "100px" }}
                    src={`https://res.cloudinary.com/digital-specie/video/upload/vs_40,dl_200,h_200,e_loop/${message.name}.gif`}
                  />
                  <div className="message_info">
                    <p>{message.content}</p>
                    <span className="time_sent">
                      <TimeAgo live={true} datetime={message.createdAt} />
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="chat_box_container">
          <span className={`recording_state ${show ? "show" : null}`}>
            Smile, am recording naw 😎
          </span>
          <video id="preview" width="140" height="100" autoPlay muted></video>
          <textarea
            value={content}
            onChange={this.handleContent.bind(this)}
            placeholder="Write message..."
            className="new-message-input-field"
          />
          <span className="text_counter">{content.length}/100</span>
        </div>
        <button onClick={this.record} className="send-message-button">
          {loading ? "Sending ..." : "Send"}
        </button>
      </div>
    );
  }
}
