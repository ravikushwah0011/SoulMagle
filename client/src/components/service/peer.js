import React from "react";

class PeerService {
  constructor() {
    
        if (!PeerService.instance) {
            this.peer = new RTCPeerConnection({
              iceServers: [
                {
                  urls: "stun:stun.l.google.com:19302",
                },
                { urls: "stun:stun1.l.google.com:19302" },
                { urls: "stun:stun2.l.google.com:19302" },
              ],
            });
            this.pendingCandidates = []; // ✅ Queue for ICE candidates
            PeerService.instance = this; 
        }
        return PeerService.instance;
    }
     


  // this.ontrack = (event) => {
  //     console.log("🔹 Remote stream received:", event.streams[0]);

  //     // ✅ Check if remoteVideoRef exists before using it
  //     if (this.remoteVideoRef?.current) {
  //         this.remoteVideoRef.current.srcObject = event.streams[0];
  //     } else {
  //         console.warn("⚠️ remoteVideoRef is null or not set");
  //     }
  // };

  getOffer = async () => {
    if (this.peer) {
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(new RTCSessionDescription(offer));
      return offer;
    }
  };

  getAnswer = async (offer) => {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("✅ Remote offer set.");
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      return answer;
    }
  };

  setRemoteDescription = async (answer) => {
    if (this.peer) {
      await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
      console.log("✅ Remote Description answer set.", this.peer.remoteDescription);

      return this.peer.remoteDescription;
      // Process pending ICE candidates after setting remote description
    //   this.processPendingCandidates();
    }
  };

  processPendingCandidates() {
    console.log("🔍 Checking for pending ICE candidates...", this.pendingCandidates);
    this.pendingCandidates.forEach(async (candidate) => {
        console.log("🚀 Adding pending ICE candidate:", candidate);
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate))
            .catch((err) => console.error("Error adding ICE candidate:", err));
    });
    this.pendingCandidates = []; // ✅ Clear queue after processing
}
}

export default new PeerService();
