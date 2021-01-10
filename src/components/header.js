import React from "react";

export default function Header({ props }) {
  const { users } = props;
  return (
    <div className="header">
      <div className="logo">
        <span>💬</span>Giphy Chat
      </div>
      <div className="side_items">
        <iframe
          src="https://ghbtns.com/github-btn.html?user=ijelechimaobi&repo=giphy-chat&type=star&count=true"
          frameBorder="0"
          scrolling="0"
          width="130"
          height="20"
          title="GitHub"
        ></iframe>
        <div className="active_users">{users.length}</div>
      </div>
    </div>
  );
}
