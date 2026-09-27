import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore.js';
import { useViewSchoolStore } from '../store/viewSchoolStore.js';

let sharedSocket = null;

// The server only accepts signed-in admins and puts each connection in its
// school's room, so the connection carries the sign-in token (and, for a
// superadmin, the school being viewed). Read fresh on every (re)connect.
const currentAuth = () => ({
  token: useAuthStore.getState().token,
  viewSchool: useViewSchoolStore.getState().school?.id,
});

// Reconnect when the account or the viewed school changes, so live updates
// always belong to what is on screen. Signed out: stay disconnected.
const reconnect = () => {
  if (!sharedSocket) return;
  sharedSocket.disconnect();
  if (currentAuth().token) sharedSocket.connect();
};

const getSocket = () => {
  if (!sharedSocket) {
    sharedSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      auth: (cb) => cb(currentAuth()),
    });
    if (currentAuth().token) sharedSocket.connect();
    useAuthStore.subscribe((s, prev) => s.token !== prev.token && reconnect());
    useViewSchoolStore.subscribe((s, prev) => s.school?.id !== prev.school?.id && reconnect());
  }
  return sharedSocket;
};

// Subscribes to a socket.io event for the lifetime of the calling component.
export function useSocketEvent(event, handler) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const socket = getSocket();
    const listener = (...args) => handlerRef.current(...args);
    socket.on(event, listener);
    return () => socket.off(event, listener);
  }, [event]);
}

export default getSocket;
