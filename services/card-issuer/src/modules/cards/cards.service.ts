import { ConflictException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { KAFKA_CLIENT, KafkaTopic, buildCloudEvent } from '@libs/kafka';
import { randomUUID } from 'crypto';
import type { IssueCardDto } from '@libs/common';
import { CardsRepository } from './cards.repository';
import { CARD_REQUEST_STATUSES } from './schemas/card-request-status.enum';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  public static readonly source = '/card-issuer/cards/issue';

  constructor(
    private readonly cardsRepository: CardsRepository,
    @Inject(KAFKA_CLIENT) private readonly kafkaClient: ClientKafka,
  ) {}

  async issueCard(issueCardDto: IssueCardDto) {
    const hasIssuedCard =
      await this.cardsRepository.checkIfCustomerHasAlreadyIssuedCardOrPendingRequest(
        issueCardDto.customer.documentNumber,
      );
    if (hasIssuedCard) {
      throw new ConflictException(
        `Customer with document ${issueCardDto.customer.documentNumber} already holds a card or has a pending request.`,
      );
    }

    const requestId = randomUUID();

    await this.cardsRepository.create({
      requestId,
      customer: {
        documentNumber: issueCardDto.customer.documentNumber,
        documentType: issueCardDto.customer.documentType,
        fullName: issueCardDto.customer.fullName,
        age: issueCardDto.customer.age,
        email: issueCardDto.customer.email,
      },
      product: {
        type: issueCardDto.product.type,
        currency: issueCardDto.product.currency,
      },
      status: CARD_REQUEST_STATUSES.PENDING,
      forceError: issueCardDto.forceError,
    });

    this.logger.log(`Card request saved, requestId: ${requestId}`);

    const event = buildCloudEvent(CardsService.source, KafkaTopic.CARD_REQUESTED, {
      ...issueCardDto,
      requestId,
    });

    this.kafkaClient.emit(KafkaTopic.CARD_REQUESTED, {
      pattern: KafkaTopic.CARD_REQUESTED,
      data: event,
    });

    this.logger.log(`Published event ${KafkaTopic.CARD_REQUESTED} for requestId: ${requestId}`);

    return { requestId, status: CARD_REQUEST_STATUSES.PENDING };
  }
}
