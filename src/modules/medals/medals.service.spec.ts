import { Test, TestingModule } from '@nestjs/testing';
import { MedalsService } from './medals.service';
import { PrismaService } from '../../common/utils/prisma.service';

describe('MedalsService', () => {
  let service: MedalsService;

  const mockPrismaService = {
    medal: {
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({}),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MedalsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MedalsService>(MedalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});