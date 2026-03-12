/**
 * CloudEvent factory following the challenge specification.
 *
 * - id:     auto-incremental counter per process lifetime
 * - source: UUID shared across a single card-issuance flow (= requestId)
 * - type:   Kafka topic name (e.g. "io.card.requested.v1")
 * - data:   event payload; may include an optional `error` field
 */

export type CloudEventError = {
  message: string;
  attempts?: number;
  [key: string]: unknown;
};

export type CloudEvent<T = Record<string, unknown>> = {
  id: number;
  source: string;
  type: string;
  data: T & { error?: CloudEventError };
};

let eventCounter = 0;

/**
 * Build a CloudEvent envelope.
 *
 * @param source  The UUID that identifies the issuance flow (requestId).
 * @param type    The Kafka topic / event type string.
 * @param data    The event payload.
 */
export function buildCloudEvent<T extends Record<string, unknown>>(
  source: string,
  type: string,
  data: T,
): CloudEvent<T> {
  eventCounter += 1;
  return { id: eventCounter, source, type, data };
}

/** Reset the counter — useful in unit tests. */
export function resetEventCounter(): void {
  eventCounter = 0;
}
