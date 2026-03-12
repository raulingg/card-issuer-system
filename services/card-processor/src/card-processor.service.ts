import { Injectable, Logger } from '@nestjs/common';
import { KafkaTopic, buildCloudEvent, KAFKA_CLIENT } from '@libs/kafka';
import { Inject } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { randomUUID } from 'crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { CardRequestedDto } from './dto/card-requested.dto';
import { CardIssuedDto } from './dto/card-issued.dto';

@Injectable()
export class CardProcessorService {
  private readonly logger = new Logger(CardProcessorService.name);
  public static readonly source = '/card-processor/issue';

  constructor(@Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka) { }

  async processRequest(payload: CardRequestedDto) {
    let attempts = 0;
    const maxRetries = 3;
    const delays = [1000, 2000, 4000];

    while (attempts <= maxRetries) {
      try {
        if (payload.data.forceError) {
          throw new Error(`Max retries reached for request ${payload.data.requestId}.`);
        }

        const cardIssuedDto = await this.#simulateExternalCall(payload);

        if ('error' in cardIssuedDto) {
          throw new Error(cardIssuedDto.error);
        }

        const event = buildCloudEvent<CardIssuedDto>(
          CardProcessorService.source,
          KafkaTopic.CARD_ISSUED,
          cardIssuedDto,
        );

        this.logger.log(event.toString());

        this.kafkaClient.emit(KafkaTopic.CARD_ISSUED, event);

        this.logger.log(`Card issued for request ${payload.data.requestId}`);
        return;
      } catch (err: any) {
        if (attempts >= maxRetries) {
          await this.#handleFailure(err.message, payload, attempts);
          return;
        }

        // exponential back-off: 1s, 2s, 4s
        const timeToDelayInMilliseconds = delays[attempts];
        this.logger.warn(
          `Attempt ${attempts + 1} failed for request ${payload.data.requestId}. Retrying in ${timeToDelayInMilliseconds}ms...`,
        );
        await delay(timeToDelayInMilliseconds);
        attempts++;
      }
    }
  }

  async #handleFailure(reason: string, payload: CardRequestedDto, attempts: number) {
    this.logger.error(reason);

    const event = buildCloudEvent(CardProcessorService.source, KafkaTopic.CARD_REQUEST_DLQ, {
      reason,
      attempts,
      originalPayload: payload,
    });

    this.kafkaClient.emit(KafkaTopic.CARD_REQUEST_DLQ, event);
  }

  async #simulateExternalCall(
    payload: CardRequestedDto,
  ): Promise<CardIssuedDto | { error: string }> {
    const timeToDelayInMilliseconds = Math.floor(Math.random() * 300) + 200; // 200-500ms
    await delay(timeToDelayInMilliseconds);
    const success = Math.random() < 0.7; // 70% chance of success

    if (!success) {
      return {
        error: `An unexpected error occurred while processing request ${payload.data.requestId} at external service.`,
      };
    }

    const cardNumber = Math.floor(Math.random() * 10000000000000000)
      .toString()
      .padStart(16, '0');
    const cardNumberMasked = `****-****-****-${cardNumber.slice(-4)}`;

    // Privacy and security: Sensitive full card number and CVV are deliberately not saved or logged.
    return {
      card: {
        id: randomUUID(),
        maskedNumber: cardNumberMasked,
        expirationDate: this.#generateRandomExpirationDate(),
      },
      requestId: payload.data.requestId,
    };
  }

  #generateRandomExpirationDate() {
    const today = new Date();
    // Credit cards expire at least one month in the future.
    const minDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    // Credit cards typically expire within 5-10 years. We'll use 5 years for a reasonable range.
    const maxDate = new Date(today.getFullYear() + 5, today.getMonth(), 1);

    // Get a random timestamp between minDate and maxDate
    const minTime = minDate.getTime();
    const maxTime = maxDate.getTime();
    const randomTime = minTime + Math.random() * (maxTime - minTime);
    const randomDate = new Date(randomTime);

    // Extract month and year
    // getMonth() returns 0-11, so add 1 for MM format
    const month = (randomDate.getMonth() + 1).toString().padStart(2, '0');
    // getFullYear() returns YYYY format
    const year = randomDate.getFullYear().toString().slice(-2); // Get last two digits (YY)

    return `${month}/${year}`;
  }
}
