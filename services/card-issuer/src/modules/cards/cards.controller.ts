import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UsePipes } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ZodValidationPipe } from '@libs/common';
import { KafkaTopic } from '@libs/kafka';
import { CardsService } from './cards.service';
import { CardRequestSchema } from '@libs/common';
import { CardRequestDto } from './dto/card-request.dto';
import { CardRequestedDlqEventDto } from './dto/card-requested-dql-event.dto';
import { CardIssuedEventDto } from './dto/card-issued-event.dto';

@Controller('cards')
export class CardsController {
  private readonly logger = new Logger(CardsController.name);

  constructor(private readonly cardsService: CardsService) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(CardRequestSchema))
  async issueCard(@Body() dto: CardRequestDto) {
    return await this.cardsService.issueCard(dto);
  }

  @EventPattern(KafkaTopic.CARD_ISSUED)
  async handleCardIssued(@Payload() event: CardIssuedEventDto): Promise<void> {
    this.logger.log(
      `Received "${KafkaTopic.CARD_ISSUED}" event for requestId: ${event.data.requestId}`,
    );

    await this.cardsService.markRequestAsIssued(event.data);
  }

  @EventPattern(KafkaTopic.CARD_REQUESTED_DLQ)
  async handleCardRequestDlq(
    @Payload()
    event: CardRequestedDlqEventDto,
  ): Promise<void> {
    this.logger.error(
      `Received "${KafkaTopic.CARD_REQUESTED_DLQ}" for requestId: ${event.data.originalPayload.requestId} after ${event.data.attempts} attempts.`,
    );

    await this.cardsService.markRequestAsFailed(event.data);
  }
}
