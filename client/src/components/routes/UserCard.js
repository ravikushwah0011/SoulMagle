
import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import "./routes.css"

const UserCard = ({user, showLastActive, explanation }) => {
  const { requestChat } = useContext(ChatContext);
  
  // console.log(user);
  
  return (
      <div  className="user-card">
        <img
          src={user.profile_photo || "assets/image/blank-dp.png"}
          alt="Profile"
          className="user-image"
        />
        <h3 className="user-name">{user.name}</h3>
        {/* <div className="w-full flex flex-col justify-start"> */}
        <p className="user-interests">Interests: 
          <span className="interest-text"> {user.interests}</span>
          </p>
        
        {explanation && <p className="user-explanation">AI Explanation: 
          <span className="explanation-text">{explanation}</span>
          </p>}
        
        {showLastActive && (
          <p className="user-last-active">Last Active: {user.last_active}</p>
        )}
        {/* </div> */}
        <button
          disabled={showLastActive}
          className="join-chat-btn"
          onClick={() => {
            alert("Joining chat...");
            requestChat(user.id);
          }}
        >
          Join Chat
        </button>
      </div>
    );
  };

export default UserCard;