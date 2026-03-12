import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_CLIENT, KafkaTopic, buildCloudEvent } from '@libs/kafka';
import { randomUUID } from 'crypto';
import type { CardIssuedEventDataDto, CardRequestedDlqEventDataDto } from '@libs/kafka';
import { CardsRepository } from './cards.repository';
import { CARD_REQUEST_STATUSES } from './schemas/card-request-status.enum';
import { CardRequestDto } from './dto/card-request.dto';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  public static readonly source = '/card-issuer/cards/issue';

  constructor(
    private readonly cardsRepository: CardsRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async issueCard(CardRequestDto: CardRequestDto) {
    const hasIssuedCard =
      await this.cardsRepository.checkIfCustomerHasAlreadyIssuedCardOrPendingRequest(
        CardRequestDto.customer.documentNumber,
      );
    if (hasIssuedCard) {
      throw new ConflictException(
        `Customer with document ${CardRequestDto.customer.documentNumber} already holds a card or has a pending request.`,
      );
    }

    const requestId = randomUUID();

    await this.cardsRepository.create({
      requestId,
      customer: {
        documentNumber: CardRequestDto.customer.documentNumber,
        documentType: CardRequestDto.customer.documentType,
        fullName: CardRequestDto.customer.fullName,
        age: CardRequestDto.customer.age,
        email: CardRequestDto.customer.email,
      },
      product: {
        type: CardRequestDto.product.type,
        currency: CardRequestDto.product.currency,
      },
      status: CARD_REQUEST_STATUSES.PENDING,
      forceError: CardRequestDto.forceError,
    });

    this.logger.log(`Card request saved, requestId: ${requestId}`);

    const event = buildCloudEvent(CardsService.source, KafkaTopic.CARD_REQUESTED, {
      ...CardRequestDto,
      requestId,
    });

    this.kafkaClient.emit(KafkaTopic.CARD_REQUESTED, event);

    this.logger.log(`Published event ${KafkaTopic.CARD_REQUESTED} for requestId: ${requestId}`);

    return { requestId, status: CARD_REQUEST_STATUSES.PENDING };
  }

  async markRequestAsIssued(eventData: CardIssuedEventDataDto): Promise<void> {
    await this.cardsRepository.markAsIssuedByRequestId(eventData.requestId, eventData.card);

    this.logger.log(`Marked card request ${eventData.requestId} as ISSUED`);
  }

  async markRequestAsFailed(eventData: CardRequestedDlqEventDataDto): Promise<void> {
    await this.cardsRepository.markAsFailedByRequestId(
      eventData.originalPayload.requestId,
      eventData.reason,
      eventData.attempts,
    );
    this.logger.error(
      `Marked card request ${eventData.originalPayload.requestId} as FAILED after ${eventData.attempts} attempts. Reason: ${eventData.reason}`,
    );
  }
}
