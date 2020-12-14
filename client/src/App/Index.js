/* eslint-disable */
import React, { useRef } from "react";
import Chat from "./chat";

export default function Home(props) {
  const videoRef = useRef();
  const setPlayBack = () => {
    videoRef.current.playbackRate = 5;
  };

  return <Chat {...props} setPlayBack={setPlayBack} videoRef={videoRef} />;
}
