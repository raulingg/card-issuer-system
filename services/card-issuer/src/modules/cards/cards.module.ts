import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CardsController } from './cards.controller';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import { CardRequest, CardRequestSchema } from './schemas/card-request.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: CardRequest.name, schema: CardRequestSchema }])],
  controllers: [CardsController],
  providers: [CardsService, CardsRepository]
})
export class CardsModule { }
