import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { KafkaTopic } from '@libs/kafka';
import { CardProcessorService } from './card-processor.service';
import { ZodValidationPipe } from '@libs/common';
import { CardRequestedEventDto, CardRequestedEventSchema } from './dto/card-request-event.dto';

@Controller()
export class CardProcessorController {
  private readonly logger = new Logger(CardProcessorController.name);

  constructor(private readonly cardProcessorService: CardProcessorService) {}

  @EventPattern(KafkaTopic.CARD_REQUESTED)
  async handleCardRequested(
    @Payload(new ZodValidationPipe(CardRequestedEventSchema)) event: CardRequestedEventDto,
  ) {
    this.logger.log(
      `Received "${KafkaTopic.CARD_REQUESTED}" from source: ${event.source} event for event ID: ${event.id}`,
    );

    this.cardProcessorService.processRequest(event);
  }
}
