export enum KafkaTopic {
  // User events
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',

  // Notification events
  NOTIFICATION_SEND = 'notification.send',
  NOTIFICATION_SENT = 'notification.sent',

  // Card issuance events
  CARD_REQUESTED = 'io.card.requested.v1',
  CARD_ISSUED = 'io.cards.issued.v1',
  CARD_REQUEST_DLQ = 'io.card.requested.v1.dlq',
}
