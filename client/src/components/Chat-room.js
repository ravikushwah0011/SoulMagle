import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
  use,
} from "react";
// import io from "socket.io-client";
import { useParams, useNavigate } from "react-router-dom";
import "./Chat.css";
import AuthContext from "./context/authContext";

// Connect to backend WebSocket
import { useSocket } from "./context/socketContext";
import peer from "./service/peer";

function ChatRoom() {
  const { roomId } = useParams();
  const { currentUser } = useContext(AuthContext);
  const socket = useSocket();
  const navigate = useNavigate();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const [remoteSocketId, setRemoteSocketId] = useState(null);
  const [stream, setStream] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("connected");
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const iceCandidateQueue = useRef([]);
  const [remoteDescriptionSet, setRemoteDescriptionSet] = useState(false);
  let remote_Description;

  const initializeMedia = async () => {
    const userStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    setStream(userStream);
    if (localVideoRef.current) localVideoRef.current.srcObject = userStream;
    return userStream;
  };

  const setupPeerConnection = async (socketId) => {
    const userStream = await initializeMedia();
    userStream.getTracks().forEach((track) => peer.peer.addTrack(track, userStream));
    
    // peer.peer.onicecandidate = (event) => {
    //   if (event.candidate) {
    //     socket.emit("send-ice-candidate", {
    //       to: roomId,
    //       candidate: event.candidate,
    //     });
    //   }
    // };
    
    peer.peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        console.log("🔹 Remote stream received:", event.streams[0]);
      }
    };
    // peer.peer.ontrack = (event) => {
    //   if (remoteVideoRef.current) {
    //     remoteVideoRef.current.srcObject = event.streams[0];
    //   }
    // };

    const offer = await peer.getOffer();
    socket.emit("offer", { to: socketId, offer });
  };

  const handleJoinedUser = useCallback(({ userId, socketId }) => {
    setRemoteSocketId(socketId);
    setConnectionStatus("connected");
    setupPeerConnection(socketId);
  }, []);

  const handleReceiveOffer = useCallback(async ({ from, offer }) => {
    const userStream = await initializeMedia();
    userStream.getTracks().forEach((track) => peer.peer.addTrack(track, userStream));

    const answer = await peer.getAnswer(offer);
    socket.emit("send-answer", { to: from, answer });

    
    // Process queued candidates after setting remote description
  peer.peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("send-ice-candidate", {
          to: roomId,
          candidate: event.candidate,
        });
      }
    };

}, [stream, socket]);

  const sendStream = useCallback(async () => {
    const userStream = await initializeMedia();
    for (const track of userStream.getTracks()) {
      peer.peer.addTrack(track, userStream);
      console.log("🔹 Track added to peer connection:", track);
    }
  }, [stream]);

  const handleReceiveAnswer = useCallback(
    async ({ from, answer }) => {
      const remoteDescription = await peer.setRemoteDescription(answer);
      remote_Description = remoteDescription;
      // remoteDescriptionSet.current = true;
      setRemoteDescriptionSet(true);
      // sendStream();
      // Process queued candidates
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("🧊 ICE Candidate processed form Queue");

    }

      // processIceQueue();
      console.log("🔹 Remote Description set:", remote_Description);
    },
    [sendStream, remoteDescriptionSet]
  );

  const handleIceCandidate = useCallback(async ({ from, candidate }) => {
    // console.log(remote_Description, "\n", remoteDescriptionSet);
    console.log(peer.peer.remoteDescription);
    console.log("🧊 ICE Candidate received:", candidate);

    
    if (peer.peer.remoteDescription) {
      await peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("🧊 ICE Candidate processed");

    } else {
      iceCandidateQueue.current.push(candidate);
      console.log(
        "🧊 ICE Candidate added to queue",
        iceCandidateQueue.current.length
      );
      socket.emit("ice-candidate-back", { to: from, candidate });
    }
    
  }, []);

  const processIceQueue = () => {
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift();
      peer.peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("🧊 ICE Candidate processed");
    }
  };

  // const handleNego_Needed = useCallback(async () => {
  //   const offer = await peer.getOffer();
  //   socket.emit("renegotiate-offer", { to: remoteSocketId, offer });
  //   console.log("🔹 Renegotiation Offer sent");
  // }, [socket]);

  // const handleNego_Needed_Incoming = useCallback(
  //   async ({ from, offer }) => {
  //     const answer = await peer.getAnswer(offer);
  //     socket.emit("renegotiate-answer", { to: from, answer });
  //     console.log("🔹 Renegotiation Answer sent");
  //   },
  //   [socket]
  // );

  // const handleNego_Needed_final = useCallback(
  //   async ({ from, answer }) => {
  //     const negoRemote = await peer.setRemoteDescription(answer);
  //     // remoteDescriptionSet.current = true;
  //     sendStream();
  //     processIceQueue();
  //     console.log("🔹 ReNego Description set:", negoRemote);
  //   },
  //   [sendStream]
  // );

  useEffect(() => {
    peer.peer.addEventListener("track", async (event) => {
      if (remoteVideoRef.current) {
        console.log("🔹 Remote stream received:", event.streams[0]);
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    });

  //   peer.peer.addEventListener("negotiationneeded", handleNego_Needed);


  //   return () => {
  //     peer.peer.removeEventListener("negotiationneeded", handleNego_Needed);
  //     // socket.off("ice-candidate-forward");
  //   };
  }, []);

  useEffect(() => {
    if (!currentUser) navigate("/");
    socket.emit("join-room", { roomId: roomId, userId: currentUser.id });

    socket.on("user-joined", handleJoinedUser);
    socket.on("receive-offer", handleReceiveOffer);
    socket.on("receive-answer", handleReceiveAnswer);
    socket.on("receive-ice-candidate", handleIceCandidate);

    // socket.on("renegotiate-offer-forward", handleNego_Needed_Incoming);
    // socket.on("renegotiate-answer-forward", handleNego_Needed_final);

    socket.on("receive-message", ({ sender, text }) =>
      setMessages((prev) => [...prev, { sender, text }])
    );
    socket.on("chat-ended", () => {
      alert("Chat Ended");
      socket.emit("leave-room", { roomId, userId: currentUser.id });
      navigate("/chat-users");
    });

    return () => {
      socket.off("user-joined", handleJoinedUser);
      socket.off("receive-offer", handleReceiveOffer);
      socket.off("receive-answer", handleReceiveAnswer);
      socket.off("receive-ice-candidate", handleIceCandidate);
      // socket.off("renegotiate-offer-forward", handleNego_Needed_Incoming);
      // socket.off("renegotiate-answer-forward", handleNego_Needed_final);
      socket.off("receive-message");
      socket.off("chat-ended");
      console.log("⚠️ Chat-room component UNMOUNTED!");

      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // if (peer.peer) {
      //   peer.peer.close();
      // }
    };
  }, [currentUser, navigate, socket]);

  const toggleMedia = (type) => {
    if (stream) {
      const tracks = stream[`get${type}Tracks`]();
      tracks.forEach((track) => (track.enabled = !track.enabled));
      type === "Audio"
        ? setAudioEnabled(!audioEnabled)
        : setVideoEnabled(!videoEnabled);
    }
  };

  const sendMessage = () => {
    if (message.trim()) {
      const msg = { roomId, text: message, sender: socket.id };
      socket.emit("send-message", msg);
      setMessages((prev) => [...prev, msg]);
      setMessage("");
    }
  };

  const endChat = () => {
    socket.emit("end-chat", { roomId });
    navigate("/chat-users");
  };

  return (
    <div className="chat-container p-4">
      <h1>Chat Room {roomId}</h1>
      <h2 className="chat-title text-xl font-bold mb-4">Video Chat</h2>
      <div className="connection-status">
        {connectionStatus === "connected" ? "🟢 Online" : "🔴 Disconnected"}
        {localVideoRef && <button onClick={sendStream}>Send Stream</button>}
      </div>
      <div className="video-container flex space-x-4">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          className="video-box w-1/2 rounded-lg shadow-md"
        />
        {remoteVideoRef && (
          <video
            ref={remoteVideoRef}
            autoPlay
            className="video-box w-1/2 rounded-lg shadow-md"
          />
        )}
      </div>
      <button onClick={() => toggleMedia("Audio")}>
        {audioEnabled ? "Mute Audio" : "Unmute Audio"}
      </button>
      <button onClick={() => toggleMedia("Video")}>
        {videoEnabled ? "Turn Off Video" : "Turn On Video"}
      </button>
      <div className="chat-input-container mt-4">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="chat-input border p-2 rounded w-3/4"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="send-button bg-blue-500 text-white px-4 py-2 rounded ml-2"
        >
          Send
        </button>
      </div>
      <div className="message-container mt-4 bg-gray-100 p-2 rounded max-h-40 overflow-y-auto">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${msg.sender === socket.id ? "self" : "other"}`}
          >
            {msg.sender === socket.id ? "You" : "Other"}: {msg.text}
          </div>
        ))}
      </div>
      <button
        onClick={endChat}
        className="end-chat-button bg-red-500 text-white px-4 py-2 mt-4 rounded"
      >
        End Chat
      </button>
    </div>
  );
}
export default ChatRoom;
