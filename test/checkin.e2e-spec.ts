import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Checkin Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let testMuseumId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 获取测试用的博物馆 ID
    // 实际测试时应该创建测试数据
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/checkin (POST)', () => {
    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .post('/v1/checkin')
        .send({
          museumId: '1',
          latitude: 39.9163,
          longitude: 116.3972,
        })
        .expect(401);
    });
  });

  describe('/v1/checkin/history (GET)', () => {
    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/v1/checkin/history')
        .expect(401);
    });
  });

  describe('/v1/checkin/statistics (GET)', () => {
    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/v1/checkin/statistics')
        .expect(401);
    });
  });
});