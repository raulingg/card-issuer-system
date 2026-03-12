export enum KafkaTopic {
  // Card issuance events
  CARD_REQUESTED = 'io.card.requested.v1',
  CARD_ISSUED = 'io.cards.issued.v1',
  CARD_REQUEST_DLQ = 'io.card.requested.v1.dlq',
}
