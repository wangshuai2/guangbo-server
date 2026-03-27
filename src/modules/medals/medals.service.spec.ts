import { Test, TestingModule } from '@nestjs/testing';
import { MedalsService } from './medals.service';

describe('MedalsService', () => {
  let service: MedalsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MedalsService],
    }).compile();

    service = module.get<MedalsService>(MedalsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
