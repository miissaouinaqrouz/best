import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

let globalSocket: Socket | null = null;

function getSocket(baseUrl: string): Socket {
  if (!globalSocket || !globalSocket.connected) {
    globalSocket = io(baseUrl, {
      path: '/api/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });
  }
  return globalSocket;
}

export function useAuctionSocket(auctionId: string | null, onBidUpdate?: (data: any) => void) {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || `https://${process.env.EXPO_PUBLIC_DOMAIN}`;
    const socket = getSocket(baseUrl);
    socketRef.current = socket;

    if (auctionId) {
      socket.emit('join:auction', auctionId);
    }

    const handleBidNew = (data: any) => {
      if (data.auctionId === auctionId || !auctionId) {
        queryClient.setQueryData(['auction', auctionId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            currentPrice: data.currentPrice,
            bidCount: data.bidCount,
            endTime: data.endTime,
            recentBids: [data.bid, ...(old.recentBids ?? [])].slice(0, 10),
          };
        });
        onBidUpdate?.(data);
      }
    };

    const handlePriceUpdated = (data: any) => {
      queryClient.setQueryData(['auction', data.auctionId], (old: any) => {
        if (!old) return old;
        return { ...old, currentPrice: data.currentPrice, bidCount: data.bidCount };
      });
      queryClient.setQueryData(['auctions'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          auctions: old.auctions?.map((a: any) =>
            a.id === data.auctionId ? { ...a, currentPrice: data.currentPrice, bidCount: data.bidCount } : a
          ),
        };
      });
    };

    const handleAuctionEnded = (data: any) => {
      queryClient.setQueryData(['auction', data.auctionId], (old: any) => {
        if (!old) return old;
        return { ...old, status: 'ended', winnerId: data.winnerId, currentPrice: data.finalPrice };
      });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    };

    const handleStatusChanged = (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['auction', data.auctionId] });
      queryClient.invalidateQueries({ queryKey: ['auctions'] });
    };

    socket.on('bid:new', handleBidNew);
    socket.on('auction:price_updated', handlePriceUpdated);
    socket.on('auction:ended', handleAuctionEnded);
    socket.on('auction:status_changed', handleStatusChanged);

    return () => {
      if (auctionId) socket.emit('leave:auction', auctionId);
      socket.off('bid:new', handleBidNew);
      socket.off('auction:price_updated', handlePriceUpdated);
      socket.off('auction:ended', handleAuctionEnded);
      socket.off('auction:status_changed', handleStatusChanged);
    };
  }, [auctionId, queryClient, onBidUpdate]);

  return socketRef.current;
}

export function useGlobalAuctionSocket() {
  return useAuctionSocket(null);
}
