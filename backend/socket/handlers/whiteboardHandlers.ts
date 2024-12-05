import { Server, Socket } from 'socket.io';

export const setupWhiteboardHandlers = (io: Server, socket: Socket) => {
  const handlers = ['draw-start', 'draw-move', 'draw-end', 'draw-undo'];
  
  handlers.forEach(event => {
    socket.on(event, (data) => {
      try {
        socket.to(data.roomId).emit(event, data);
      } catch (error) {
        console.error(`Error in whiteboard ${event} handler:`, error);
      }
    });
  });
}; 