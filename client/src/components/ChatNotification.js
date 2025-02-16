import { useContext, useState } from "react";
import { ChatContext } from "./context/ChatContext";
import './ChatNotify.css'

const ChatNotification = () => {
  const { requestingUser, acceptChat, rejectChat } = useContext(ChatContext);

  const [visible, setVisible] = useState(true); // Control visibility

  if (!visible) return null; // Hide if not visible
  if (!requestingUser) return null; // Hide if no request
  
  return (
    <div className="chat-notification">
      <p className="notification-title">Incoming Chat Request</p>
      <p className="notification-message">
        User {requestingUser} wants to chat.
      </p>
      <div className="notification-buttons">
        <button
          onClick={() => {
            acceptChat();
            setVisible(false);
          }}
          className="notification-button accept"
        >
          Accept
        </button>
        <button onClick={rejectChat} className="notification-button reject">
          Reject
        </button>
      </div>
    </div>
  );
};

export default ChatNotification;
