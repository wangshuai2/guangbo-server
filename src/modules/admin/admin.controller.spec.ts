import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { MuseumService } from './museum.service';
import { UserManageService } from './user-manage.service';
import { StatsService } from './stats.service';
import { JwtService } from '@nestjs/jwt';

describe('AdminController', () => {
  let controller: AdminController;

  const mockAdminService = {
    login: jest.fn().mockResolvedValue({ token: 'test-token' }),
    getProfile: jest.fn().mockResolvedValue({ id: 1, username: 'admin' }),
    initSuperAdmin: jest.fn().mockResolvedValue({ id: 1 }),
  };

  const mockMuseumService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn().mockResolvedValue({}),
    create: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    remove: jest.fn().mockResolvedValue({}),
    toggle: jest.fn().mockResolvedValue({}),
  };

  const mockUserManageService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn().mockResolvedValue({}),
    update: jest.fn().mockResolvedValue({}),
    ban: jest.fn().mockResolvedValue({}),
  };

  const mockStatsService = {
    getOverview: jest.fn().mockResolvedValue({}),
    getFootprintStats: jest.fn().mockResolvedValue([]),
    getMedalStats: jest.fn().mockResolvedValue([]),
    getHotMuseums: jest.fn().mockResolvedValue([]),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('test-token'),
    verify: jest.fn().mockReturnValue({ sub: 1, username: 'admin' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: AdminService, useValue: mockAdminService },
        { provide: MuseumService, useValue: mockMuseumService },
        { provide: UserManageService, useValue: mockUserManageService },
        { provide: StatsService, useValue: mockStatsService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});