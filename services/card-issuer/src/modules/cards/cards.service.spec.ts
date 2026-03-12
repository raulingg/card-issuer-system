import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { CardsService } from './cards.service';
import { CardsRepository } from './cards.repository';
import { KafkaTopic, KAFKA_CLIENT } from '@libs/kafka';
import { ConflictException } from '@nestjs/common';
import type { IssueCardDto } from './dto/issue-card.dto';
import { CARD_REQUEST_STATUSES } from './schemas/card-request-status.enum';
import type { CardRequestDocument } from './schemas/card-request.schema';
import { CardRequest } from './schemas/card-request.schema';
import type { ClientKafka } from '@nestjs/microservices';
import type { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

const requestId = 'requestId';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => requestId),
}));

function issueCardDtoFactory(data: Partial<IssueCardDto> = {}): IssueCardDto {
  return {
    customer: {
      documentType: 'DNI',
      documentNumber: '12345678',
      fullName: 'John Doe',
      age: 25,
      email: 'john@example.com',
    },
    product: {
      type: 'VISA',
      currency: 'PEN',
    },
    forceError: false,
    ...data,
  };
}

describe('CardsService', () => {
  let cardsService: CardsService;
  let cardsRepository: jest.Mocked<CardsRepository>;
  let kafkaClient: jest.Mocked<ClientKafka>;
  let cardRequestModel: jest.Mocked<Model<CardRequestDocument>>;

  beforeEach(async () => {
    cardsRepository = {
      checkIfCustomerHasAlreadyIssuedCardOrPendingRequest: jest.fn(),
      create: jest.fn(),
    } as unknown as jest.Mocked<CardsRepository>;

    kafkaClient = {
      emit: jest.fn(),
    } as unknown as jest.Mocked<ClientKafka>;

    cardRequestModel = {} as unknown as jest.Mocked<Model<CardRequestDocument>>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        {
          provide: CardsRepository,
          useValue: cardsRepository,
        },
        {
          provide: KAFKA_CLIENT,
          useValue: kafkaClient,
        },
        {
          provide: getModelToken(CardRequest.name),
          useValue: cardRequestModel,
        },
      ],
    }).compile();

    cardsService = module.get<CardsService>(CardsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('issueCard', () => {
    it('should successfully issue a card and emit a Kafka event', async () => {
      const mockIssueCardDto = issueCardDtoFactory();
      cardsRepository.checkIfCustomerHasAlreadyIssuedCardOrPendingRequest.mockResolvedValue(false);
      cardsRepository.create.mockResolvedValue({} as any);

      const result = await cardsService.issueCard(mockIssueCardDto);

      expect(
        cardsRepository.checkIfCustomerHasAlreadyIssuedCardOrPendingRequest,
      ).toHaveBeenCalledWith(mockIssueCardDto.customer.documentNumber);

      expect(cardsRepository.create).toHaveBeenCalledWith({
        requestId,
        customer: {
          documentNumber: mockIssueCardDto.customer.documentNumber,
          documentType: mockIssueCardDto.customer.documentType,
          fullName: mockIssueCardDto.customer.fullName,
          age: mockIssueCardDto.customer.age,
          email: mockIssueCardDto.customer.email,
        },
        product: {
          type: mockIssueCardDto.product.type,
          currency: mockIssueCardDto.product.currency,
        },
        status: CARD_REQUEST_STATUSES.PENDING,
        forceError: mockIssueCardDto.forceError,
      });

      expect(kafkaClient.emit).toHaveBeenCalledWith(
        KafkaTopic.CARD_REQUESTED,
        expect.objectContaining({
          pattern: KafkaTopic.CARD_REQUESTED,
          data: expect.objectContaining({
            id: 1,
            source: cardsService.source,
            type: KafkaTopic.CARD_REQUESTED,
            data: {},
          }),
        }),
      );

      expect(result).toEqual({
        requestId,
        status: CARD_REQUEST_STATUSES.PENDING,
      });
    });

    it('should throw ConflictException if the customer already has an issued card or pending request', async () => {
      const mockIssueCardDto = issueCardDtoFactory();
      cardsRepository.checkIfCustomerHasAlreadyIssuedCardOrPendingRequest.mockResolvedValue(true);

      await expect(cardsService.issueCard(mockIssueCardDto)).rejects.toThrow(ConflictException);

      expect(
        cardsRepository.checkIfCustomerHasAlreadyIssuedCardOrPendingRequest,
      ).toHaveBeenCalledWith(mockIssueCardDto.customer.documentNumber);
      expect(cardsRepository.create).not.toHaveBeenCalled();
      expect(kafkaClient.emit).not.toHaveBeenCalled();
    });
  });
});
