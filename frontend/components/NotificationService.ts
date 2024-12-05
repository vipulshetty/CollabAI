// components/NotificationService.ts
import { Socket } from 'socket.io-client';

export class NotificationService {
  private socket: Socket;

  constructor(socket: Socket) {
    this.socket = socket;
  }

  sendMeetingReminder(meetingId: string, participants: string[]) {
    this.socket.emit('send-notification', {
      type: 'meeting-reminder',
      meetingId,
      participants,
      message: 'Your meeting is starting soon!'
    });
  }

  sendActionItemNotification(userId: string, actionItems: string[]) {
    this.socket.emit('send-notification', {
      type: 'action-items',
      userId,
      actionItems
    });
  }

  listenForNotifications(callback: (notification: any) => void) {
    this.socket.on('notification', callback);
  }
}