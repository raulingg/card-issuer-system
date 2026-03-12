import { Body, Controller, HttpCode, HttpStatus, Logger, Post, UsePipes } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ZodValidationPipe } from '@libs/common';
import { CloudEvent, KafkaTopic } from '@libs/kafka';
import { CardsService } from './cards.service';
import { IssueCardDto, IssueCardSchema } from '@libs/common';

type CardIssuedPayload = {
  card: {
    id: string;
    maskedNumber: string;
    expirationDate: string;
  };
  requestId: string;
};

@Controller('cards')
export class CardsController {
  private readonly logger = new Logger(CardsController.name);

  constructor(private readonly cardsService: CardsService) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(IssueCardSchema))
  async issueCard(@Body() dto: IssueCardDto) {
    return await this.cardsService.issueCard(dto);
  }

  @EventPattern(KafkaTopic.CARD_ISSUED)
  async handleCardIssued(@Payload() payload: CloudEvent<CardIssuedPayload>): Promise<void> {
    this.logger.log(
      `Received "${KafkaTopic.CARD_ISSUED}" event for requestId: ${payload.data.requestId}`,
    );

    await this.cardsService.completeIssuanceFromEvent(payload.data);
  }
}
