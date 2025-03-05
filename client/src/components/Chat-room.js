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
  const [messagesOpen, setMessagesOpen] = useState(false);

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
    userStream
      .getTracks()
      .forEach((track) => peer.peer.addTrack(track, userStream));

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
        // console.log("🔹 Remote stream received:", event.streams[0]);
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

  const handleReceiveOffer = useCallback(
    async ({ from, offer }) => {
      const userStream = await initializeMedia();
      userStream
        .getTracks()
        .forEach((track) => peer.peer.addTrack(track, userStream));

      const answer = await peer.getAnswer(offer);
      socket.emit("send-answer", { to: from, answer });

      // peer.peer.ontrack = (event) => {
      //   if (remoteVideoRef.current) {
      //     remoteVideoRef.current.srcObject = event.streams[0];
      //     console.log("🔹 Remote stream received:", event.streams[0]);
      //   }
      // };

      // Process queued candidates after setting remote description
      peer.peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("send-ice-candidate", {
            to: roomId,
            candidate: event.candidate,
          });
        }
      };
    },
    [stream, socket]
  );

  const sendStream = useCallback(async () => {
    const userStream = await initializeMedia();
    for (const track of userStream.getTracks()) {
      peer.peer.addTrack(track, userStream);
      console.log("🔹 Track added to peer connection:", track);
    }
  }, [stream]);

  const handleReceiveAnswer = useCallback(
    async ({ from, answer }) => {
      try {
        const remoteDescription = await peer.setRemoteDescription(answer);
        remote_Description = remoteDescription;
        // remoteDescriptionSet.current = true;
        setRemoteDescriptionSet(true);
        // sendStream();
      } catch (error) {
        console.error("🔹 Error setting remote description:", error);
      }
      // Process queued candidates
      while (iceCandidateQueue.current.length > 0) {
        const candidate = iceCandidateQueue.current.shift();
        if (candidate === null) {
          continue;
        }
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

    if (peer.peer.remoteDescription !== null) {
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
        // console.log("🔹 Remote stream received:", event.streams[0]);
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
      navigate("/");
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
        stream.getTracks().forEach((track) => track.stop());
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
        {/* {localVideoRef && <button onClick={sendStream}>Send Stream</button>} */}
      </div>
      <div className={`chat-room-container ${messagesOpen ? "split-view" : ""}`}>
        <div className="chat-video-container flex flex-col space-x-4">
          <div className="video-container flex">
          {/* <p className="user-label">You</p> */}
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
          <div className="toggle-container flex space-x-4 mt-4"> 
          <button
            onClick={() => toggleMedia("Audio")}
            className={`p-3 rounded-full transition-all ${
              audioEnabled ? "bg-sky-500 text-white" : "bg-red-500"
            }`}
          >
            {audioEnabled ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M11 5c0-.55.45-1 1-1s1 .45 1 1v5.17l1.82 1.82c.11-.31.18-.64.18-.99V5c0-1.66-1.34-3-3-3S9 3.34 9 5v1.17l2 2V5zM2.81 2.81L1.39 4.22l11.65 11.65c-.33.08-.68.13-1.04.13-2.76 0-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c.57-.08 1.12-.24 1.64-.46l5.14 5.14 1.41-1.41L2.81 2.81zM19 11h-2c0 .91-.26 1.75-.69 2.48l1.46 1.46A6.921 6.921 0 0 0 19 11z" />
                </svg>
            )}
          </button>

          <button
            onClick={() => toggleMedia("Video")}
            className={`p-3 rounded-full transition-all ${
              videoEnabled ? "bg-sky-500 text-white" : "bg-red-500"
            }`}
          >
            {videoEnabled ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h8.25a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3H4.5ZM19.94 18.75l-2.69-2.69V7.94l2.69-2.69c.944-.945 2.56-.276 2.56 1.06v11.38c0 1.336-1.616 2.005-2.56 1.06Z" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path d="M.97 3.97a.75.75 0 0 1 1.06 0l15 15a.75.75 0 1 1-1.06 1.06l-15-15a.75.75 0 0 1 0-1.06ZM17.25 16.06l2.69 2.69c.944.945 2.56.276 2.56-1.06V6.31c0-1.336-1.616-2.005-2.56-1.06l-2.69 2.69v8.12ZM15.75 7.5v8.068L4.682 4.5h8.068a3 3 0 0 1 3 3ZM1.5 16.5V7.682l11.773 11.773c-.17.03-.345.045-.523.045H4.5a3 3 0 0 1-3-3Z" />
              </svg>
            )}
          </button>

          {/* Message Toggle */}
          <button
            onClick={() => setMessagesOpen(!messagesOpen)}
            className={`p-3 rounded-full transition-all ${
              messagesOpen ? "bg-blue-500 text-white" : "bg-gray-400 text-sky-600"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
              />
            </svg>
          </button>
          <button
            onClick={endChat}
            className="p-3 rounded-full bg-red-100 hover:bg-red-700 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-6"
            >
              <path
                fillRule="evenodd"
                d="M15.22 3.22a.75.75 0 0 1 1.06 0L18 4.94l1.72-1.72a.75.75 0 1 1 1.06 1.06L19.06 6l1.72 1.72a.75.75 0 0 1-1.06 1.06L18 7.06l-1.72 1.72a.75.75 0 1 1-1.06-1.06L16.94 6l-1.72-1.72a.75.75 0 0 1 0-1.06ZM1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          </div>
        </div>

        <div className="chat-messages-container mt-4 bg-gray-100 p-2 rounded overflow-y-auto">
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
        </div>
        </div>
    </div>
  );
}
export default ChatRoom;
