import Cookies from "js-cookie";
import Toggler_Img from "../assets/reload.svg";
import React, { useCallback, useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";

export default function ChatBox({ props }) {
  const [recording, setRecording] = useState(false);
  const [message, setMessage] = useState("");
  const [frontMode, setFrontMode] = useState(true);
  const [counter, setCounter] = useState(100);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  const { sendMessage, startTyping, stopTyping, typers } = props;

  // Get our current user
  const user = Cookies.get("giphy_user");
  const isTyping = typers.includes(user);

  const onFocus = () => {
    setIsVisible(true);
  };

  const onBlur = () => {
    setIsVisible(false);
  };

  // Setting the counter state
  useEffect(() => {
    const timer =
      counter > 0 && setInterval(() => setCounter(counter - 10), 500);

    // Handle changing webcam state onblur and on focus
    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    // Specify how to clean up after this effect:
    return () => {
      clearInterval(timer);
    };
  }, [counter]);

  // Useful video constraints
  const videoConstraints = {
    facingMode: frontMode ? "user" : { exact: "environment" },
    width: 140,
    height: 100,
  };

  // Change the camera mode (front / back)
  const handleChangeCamMode = () => {
    setFrontMode(!frontMode);
  };

  // If video data is available
  const handleDataAvailable = useCallback(
    ({ data }) => {
      var rawArray = [];
      rawArray.push(data);

      const blob = new Blob(rawArray, {
        type: "video/webm",
      });
      const handleSendMessage = () => {
        sendMessage(message, blob);
        setRecording(false);
        setMessage("");
      };
      return handleSendMessage();
    },
    [message, sendMessage]
  );

  // Stop the recording and initiate the send message
  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
  }, []);

  // start the recording
  const handleStartCaptureClick = useCallback(() => {
    setRecording(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm",
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();
    setTimeout(() => {
      handleStopCaptureClick();
    }, 2000);
  }, [handleDataAvailable, handleStopCaptureClick]);

  // Save the message the user is typing in the input field.
  const handleContent = (event) => {
    if (message.length < 100) {
      setMessage(event.target.value);
    }
  };

  return (
    <>
      <div className="chat_box_container">
        <span
          className={`typing_state ${typers.length > 0 && !isTyping && "show"}`}
        >
          {typers.lenth > 1
            ? "People are typing . . ."
            : "Someone is typing . . ."}
        </span>
        <span className={`recording_state ${recording && "show"}`}>
          Smile, am recording naw 😎
        </span>
        {/** <CircularProgressbar value={counter} text={`${counter}%`} /> */}
        {/** The webcam */}
        {isVisible ? (
          <div className="cam_holder">
            <Webcam
              width={140}
              height={100}
              audio={false}
              ref={webcamRef}
              videoConstraints={videoConstraints}
            />
            <button className="toggle_cam_btn" onClick={handleChangeCamMode}>
              <img src={Toggler_Img} alt="Giphy Chat Toggler" />
            </button>
          </div>
        ) : (
          <div className="no_cam" />
        )}
        <textarea
          placeholder="Write message..."
          className="new-message-input-field"
          value={message}
          onChange={handleContent}
          onFocus={startTyping}
          onBlur={stopTyping}
        />
        <span className="text_counter">{message.length}/100</span>
      </div>
      <button onClick={handleStartCaptureClick} className="send-message-button">
        {recording ? "Sending ..." : "Send"}
      </button>
    </>
  );
}
