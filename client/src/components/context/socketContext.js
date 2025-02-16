import React ,{ createContext, useContext, useMemo } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext(null);

export const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
};

export const SocketProvider = ({ children }) => {
    const socket = useMemo(() => io.connect("" || "http://localhost:5000", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  }), []);    
    
    return ( 
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
     );
};
// }), []); 