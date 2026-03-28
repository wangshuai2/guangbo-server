import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

interface Response<T> {
  code: number;
  message: string;
  data: T;
  meta: {
    timestamp: number;
    requestId: string;
  };
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest<Request>();

    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
        meta: {
          timestamp: Date.now(),
          requestId: request.headers['x-request-id'] as string || `req_${Date.now()}`,
        },
      })),
    );
  }
}