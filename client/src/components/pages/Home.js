// client/src/components/Home.js
import React, { useState, useContext,useEffect } from "react";

import { useNavigate } from "react-router-dom";
import AuthContext from "../context/authContext";
import AIMatchSearch from "../routes/search";
import Navbar from "../Navbar";

function Home() {
  const { currentUser } = useContext(AuthContext);

  const navigate = useNavigate();

  

  const text =
    "Looking for someone who shares your interests? Let AI do the work! Just enter your interests, and we'll find the perfect match for you.";
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      // if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1)); // Take substring instead of appending
        index++;
  
        if (index === text.length) {
          clearInterval(interval);
      }
    }, 50); // Adjust typing speed here

    return () => clearInterval(interval);
  }, []);

  const goToChat = () => {
    navigate("/chat-users");
  };

  return (
    <div style={{ margin: "auto", paddingTop: "60px"}}>

      {/* <Navbar /> */}
      <h1 className="text-indigo-900 from-sky-700 to-yellow-300 text-3xl">Welcome to SoulMagle!</h1>
      <div style={{ padding: "1em"}}>
        <h2 style={{fontSize: "1.5em"}}>AI Search</h2>
        <p className="typing-text">
          {displayedText}
          <span className="cursor">|</span>
        </p>
        <AIMatchSearch />
        
      </div>
      <div style={{ padding: "1em"}}>
        <h2 style={{fontSize: "1.5em"}}>Random People Available for Video Chat</h2>
        <button onClick={goToChat} className="random-chat-btn">Start Radom Chat</button>
      </div>
    </div>
  );
}

export default Home;
