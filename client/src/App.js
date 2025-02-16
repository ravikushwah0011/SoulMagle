// client/src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import ChatRoom from "./components/Chat-room";
import Profile from "./components/pages/Profile";
import ChatUsersPage from "./components/pages/ChatUsersPage";
import Navbar from "./components/Navbar";

import "./App.css";
import { SocketProvider } from "./components/context/socketContext"; // Import the AuthProvider
import { ChatProvider } from "./components/context/ChatContext";
import { AuthProvider } from "./components/context/authContext";

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ChatProvider>
          <div>
            <Navbar /> {/* Fixed navbar */}
            <div className="content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                {/* <Route path="/chat" element={<Chat />} /> */}
                <Route path="/chat-room/:roomId" element={<ChatRoom />} />
                <Route path="/chat-users" element={<ChatUsersPage />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </div>
          </div>
        </ChatProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
