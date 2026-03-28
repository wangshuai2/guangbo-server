import { Test, TestingModule } from '@nestjs/testing';
import { MedalsController } from './medals.controller';
import { MedalsService } from './medals.service';

describe('MedalsController', () => {
  let controller: MedalsController;

  const mockMedalsService = {
    findAll: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedalsController],
      providers: [
        {
          provide: MedalsService,
          useValue: mockMedalsService,
        },
      ],
    }).compile();

    controller = module.get<MedalsController>(MedalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});