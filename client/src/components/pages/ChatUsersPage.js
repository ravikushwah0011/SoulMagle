import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import AuthContext from "../context/authContext";

import UserCard from "../routes/UserCard";


import Navbar from "../Navbar";
import "./Pages.css"



const ChatUsersPage = () => {
  const { currentUser } = useContext(AuthContext);

  const [liveUsers, setLiveUsers] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const navigate = useNavigate();
  // const [requestingUser, setRequestingUser] = useState(null); // Stores who sent the request

  useEffect(() => {
    // Fetch live users and recent users from backend
    console.log("Fetching users..."); // ✅ Debugging

    axios
      .get("http://localhost:5000/api/users/live")
      .then((response) => {
        // console.log("API Response:", response.data); // ✅ See what backend returns
        setLiveUsers(response.data.live_Users || []); // Ensure fallback to empty array
        setRecentUsers(response.data.recent_Users || []);
      })
      .catch((error) => console.error("Error fetching users:", error));

    return () => {
      console.log("Chat Users Page is here");
    };
  }, [currentUser?.id]);


  return (
    <div>
      
      {/* <Navbar /> */}

      <div className="container">
        <h2 className="section-title">Live Users</h2>
        <div className="grid-container">
          {liveUsers
            .filter((user) => user.id !== currentUser.id) // Filter out the current user
            .map((user) => (
              <div key={user.id}>
              <UserCard
                // key={user.id}
                user={user}
               showLastActive={user.is_live}
             //   requestChat={requestChat}
              />
              {/* {UserCard(user, user.is_live)} */}
              </div>
              // <UserCard key={user.id} user={user} requestChat={requestChat} />
            ))}
        </div>

        <h2 className="section-title">Recently Live Users</h2>
        <div className="grid-container">
          {recentUsers
            .filter((user) => user.id !== currentUser.id) // Filter out the current user
            .map((user) => (
              <div key={user.id}>
              {/* {UserCard(user, !user.is_live)} */}
              // <UserCard
                //  key={user.id}
                 user={user}
                 showLastActive={!user.is_live}
              //   requestChat={requestChat}
               />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ChatUsersPage;
