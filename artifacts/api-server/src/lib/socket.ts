import { Server } from "socket.io";
import http from "http";

let io: Server;

export function createSocketServer(server: http.Server) {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    socket.on("join:auction", (auctionId: string) => {
      socket.join(`auction:${auctionId}`);
    });
    socket.on("leave:auction", (auctionId: string) => {
      socket.leave(`auction:${auctionId}`);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitBidUpdate(auctionId: string, payload: {
  bid: object;
  currentPrice: number;
  bidCount: number;
  endTime: string;
}) {
  if (!io) return;
  io.to(`auction:${auctionId}`).emit("bid:new", payload);
  io.emit("auction:price_updated", { auctionId, currentPrice: payload.currentPrice, bidCount: payload.bidCount });
}

export function emitAuctionEnded(auctionId: string, winnerId: string | null, finalPrice: number) {
  if (!io) return;
  io.to(`auction:${auctionId}`).emit("auction:ended", { auctionId, winnerId, finalPrice });
  io.emit("auction:status_changed", { auctionId, status: "ended" });
}

export function emitAuctionLive(auctionId: string) {
  if (!io) return;
  io.emit("auction:status_changed", { auctionId, status: "live" });
}
