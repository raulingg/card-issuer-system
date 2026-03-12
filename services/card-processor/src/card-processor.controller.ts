import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopic } from '@libs/kafka';
import { CardProcessorService } from './card-processor.service';
import { ZodValidationPipe } from '@libs/common';
import { CardRequestedSchema, CardRequestedDto } from './dto/card-requested.dto';

@Controller()
export class CardProcessorController {
  private readonly logger = new Logger(CardProcessorController.name);

  constructor(private readonly cardProcessorService: CardProcessorService) {}

  @EventPattern(KafkaTopic.CARD_REQUESTED)
  async handleCardRequested(
    @Payload(new ZodValidationPipe(CardRequestedSchema)) payload: CardRequestedDto,
  ) {
    this.logger.log(
      `Received "${KafkaTopic.CARD_REQUESTED}" from source: ${payload.source} event for event ID: ${payload.id}`,
    );

    this.cardProcessorService.processRequest(payload);
  }
}
