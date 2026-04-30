import { io, type Socket } from "socket.io-client";
import { API_BASE_URL, getToken } from "./api";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (socket && socket.connected) return socket;
  socket = io(API_BASE_URL, {
    transports: ["websocket"],
    auth: { token: getToken() },
    autoConnect: true,
  });
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
