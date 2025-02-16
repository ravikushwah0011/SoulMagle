import { createContext, useState, useEffect, useContext } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "./authContext"; // Import existing AuthContext for currentUser
import { useNavigate } from "react-router-dom";
import { useSocket } from "./socketContext";
// const socket = io("http://localhost:5000"); // backend URL

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser } = useContext(AuthContext);
  const socket = useSocket();

  const [requestingUser, setRequestingUser] = useState(null); // Stores who sent the request
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser?.id) {
      console.log(`🔗 Registering socket: ${currentUser.id}`);
      socket.emit("register", currentUser.id);
    }
    //return;
    // Handle incoming chat request
    // socket.on("incoming-chat-request", ({ senderId }) => {
    //   console.log("chat-requestingUser", senderId, requestingUser);
    //   setRequestingUser(senderId);

    // ✅ Handle incoming chat request
    const handleIncomingRequest = ({ senderId }) => {
      console.log("Received chat request from:", senderId);
      setRequestingUser(senderId); // Update the state
    };

    socket.on("incoming-chat-request", handleIncomingRequest);

    // });
    const userId = currentUser;
    socket.on("chat-accepted-forward", ({ roomId }) => {
      console.log(`✅ Chat started in room: ${roomId}`, userId);

      // socket.emit("join-room", { roomId: roomId, userId: currentUser.id });
      navigate(`/chat-room/${roomId}`);
    });

    socket.on("chat-rejected", () => {
      alert("Chat request was rejected.");
    });

    return () => {
      socket.off("incoming-chat-request");
      socket.off("chat-accepted-forward");
      socket.off("chat-rejected");
    };
  }, [currentUser?.id, navigate]);

  const requestChat = (receiverId) => {
    // const senderId = localStorage.getItem("userId");
    const senderId = currentUser.id;
    console.log(receiverId, senderId);

    socket.emit("chat-request", { senderId, receiverId });
    alert("Chat request sent!");
  };

  const acceptChat = () => {
    const senderId = requestingUser;
    // const receiverId = localStorage.getItem("userId");
    const receiverId = currentUser.id;
    // const room = `${senderId}-${receiverId}`;
    const roomId = senderId - receiverId;
    socket.emit("chat-accepted", { senderId, receiverId, roomId });

    console.log(senderId, receiverId, roomId);

    navigate(`/chat-room/${roomId}`);
  };

  const rejectChat = () => {
    socket.emit("chat-rejected", { senderId: requestingUser });
    setRequestingUser(null);
  };

  return (
    <ChatContext.Provider
      value={{ requestingUser, requestChat, acceptChat, rejectChat }}
    >
      {children}
    </ChatContext.Provider>
  );
};
