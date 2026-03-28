import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Medal Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/v1/medals (GET)', () => {
    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/v1/medals')
        .expect(401);
    });
  });

  describe('/v1/medals/my (GET)', () => {
    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/v1/medals/my')
        .expect(401);
    });
  });

  describe('/v1/medals/:id (GET)', () => {
    it('should reject unauthenticated requests', () => {
      return request(app.getHttpServer())
        .get('/v1/medals/1')
        .expect(401);
    });
  });
});