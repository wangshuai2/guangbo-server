import { Test, TestingModule } from '@nestjs/testing';
import { MedalsController } from './medals.controller';

describe('MedalsController', () => {
  let controller: MedalsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MedalsController],
    }).compile();

    controller = module.get<MedalsController>(MedalsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
