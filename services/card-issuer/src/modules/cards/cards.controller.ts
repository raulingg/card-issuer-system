import { Body, Controller, HttpCode, HttpStatus, Post, UsePipes } from '@nestjs/common';
import { ZodValidationPipe } from '@libs/common';
import { CardsService } from './cards.service';
import { IssueCardDto, IssueCardSchema } from '@libs/common';

@Controller('cards')
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Post('issue')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ZodValidationPipe(IssueCardSchema))
  async issueCard(@Body() dto: IssueCardDto) {
    return await this.cardsService.issueCard(dto);
  }
}
