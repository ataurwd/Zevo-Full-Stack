"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthProvider";
import { getAccessToken } from "../lib/api/client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (roomName: string) => void;
  leaveRoom: (roomName: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinRoom: () => {},
  leaveRoom: () => {},
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Determine backend socket URL
    const defaultSocketUrl =
      typeof window !== "undefined" &&
      !window.location.hostname.includes("localhost") &&
      !window.location.hostname.includes("127.0.0.1")
        ? "https://zevo-full-stack.onrender.com"
        : "http://localhost:5000";

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
      defaultSocketUrl;

    const socketInstance = io(socketUrl, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: {
        token: (typeof window !== "undefined" ? getAccessToken() : null) || undefined,
      },
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      // If user is authenticated, join personal room
      if (user && (user as any)._id) {
        socketInstance.emit("join:personal", (user as any)._id);
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("connect_error", () => {
      setIsConnected(false);
    });

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, user]);

  const joinRoom = useCallback((roomName: string) => {
    if (socketRef.current) {
      if (roomName.startsWith("order:")) {
        socketRef.current.emit("join:order", roomName.replace("order:", ""));
      } else if (roomName.startsWith("delivery:")) {
        socketRef.current.emit("join:delivery", roomName.replace("delivery:", ""));
      } else {
        socketRef.current.emit("join:room", roomName);
      }
    }
  }, []);

  const leaveRoom = useCallback((roomName: string) => {
    if (socketRef.current) {
      if (roomName.startsWith("order:")) {
        socketRef.current.emit("leave:order", roomName.replace("order:", ""));
      } else if (roomName.startsWith("delivery:")) {
        socketRef.current.emit("leave:delivery", roomName.replace("delivery:", ""));
      } else {
        socketRef.current.emit("leave:room", roomName);
      }
    }
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinRoom,
        leaveRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket(): SocketContextType {
  return useContext(SocketContext);
}
