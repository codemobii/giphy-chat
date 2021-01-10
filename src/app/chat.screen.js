import React from "react";
import Fadeloader from "react-spinners/FadeLoader";
import ChatBox from "../components/chat.box";
import Header from "../components/header";
import MessagBox from "../components/message.box";

export default function ChatScreen(props) {
  // Creates a websocket and manages messaging
  const { messages, loading, whatIsLoading } = props;

  return (
    <div className="chat-room-container">
      {/** This is the header */}
      <Header props={props} />
      <div id="chat" className="messages-container">
        {loading ? (
          <>
            {/** Loading state */}
            <div className="loading_cont">
              <Fadeloader size={24} color={"#31a24c"} loading={true} />
              {whatIsLoading !== 0 && (
                <p className="loading_title">
                  {whatIsLoading === 1
                    ? "Setting Utilities"
                    : whatIsLoading === 2
                    ? "Loading Chat Engine"
                    : null}
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            {/** User Messages Panel */}
            <ol className="messages-list">
              {messages.map((msg, i) => (
                <MessagBox msg={msg} key={i + 1} />
              ))}
            </ol>
          </>
        )}
      </div>

      {/** Chatting Panel */}
      <ChatBox props={props} />
    </div>
  );
}
