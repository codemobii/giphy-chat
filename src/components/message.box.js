import { LazyLoadImage } from "react-lazy-load-image-component";
import React from "react";
import TimeAgo from "timeago-react";

export default function MessagBox({ msg, i }) {
  // handling download
  const handleDownload = (source) => {
    var link = document.createElement("a");
    link.href = source;
    link.download = "giphy-chat.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <li key={i} className={`message-item received-message`}>
      <LazyLoadImage
        alt="Giphy Chat GIF"
        height="100px"
        src={`https://res.cloudinary.com/digital-specie/video/upload/vs_40,dl_50,h_200,e_loop/${msg.gif}.gif`}
        width="140px"
        onClick={() =>
          handleDownload(
            `https://res.cloudinary.com/digital-specie/video/upload/vs_40,dl_50,h_200,e_loop/${msg.gif}.gif`
          )
        }
      />
      <div className="message_info">
        <div className="text">{msg.message}</div>
        <div className="time_sent">
          <TimeAgo live={true} datetime={msg.createdAt} />, @{msg.sender_name}
        </div>
      </div>
    </li>
  );
}
