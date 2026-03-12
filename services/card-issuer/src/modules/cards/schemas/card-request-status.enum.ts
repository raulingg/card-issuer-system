export const CARD_REQUEST_STATUSES = {
  PENDING: 'PENDING',
  ISSUED: 'ISSUED',
  FAILED: 'FAILED',
} as const;

export type CardRequestStatus =
  (typeof CARD_REQUEST_STATUSES)[keyof typeof CARD_REQUEST_STATUSES];
