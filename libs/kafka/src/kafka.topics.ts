export enum KafkaTopic {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Notification events
  NOTIFICATION_SEND = 'notification.send',
  NOTIFICATION_SENT = 'notification.sent',
}
