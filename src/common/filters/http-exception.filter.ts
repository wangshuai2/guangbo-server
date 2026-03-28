import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  code: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
  meta: {
    timestamp: number;
    requestId: string;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 30001;
    let errors: Array<{ field: string; message: string }> | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const responseObj = exceptionResponse as Record<string, any>;
        message = responseObj.message || message;
        errors = responseObj.errors;
        code = responseObj.code || this.getCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      console.error('Unhandled exception:', exception);
    }

    const errorResponse: ErrorResponse = {
      code,
      message,
      meta: {
        timestamp: Date.now(),
        requestId: request.headers['x-request-id'] as string || `req_${Date.now()}`,
      },
    };

    if (errors) {
      errorResponse.errors = errors;
    }

    response.status(status).json(errorResponse);
  }

  private getCodeFromStatus(status: number): number {
    const codeMap: Record<number, number> = {
      400: 10001, // 参数错误
      401: 20001, // 未登录
      403: 20003, // 权限不足
      404: 10002, // 资源不存在
      409: 10003, // 资源已存在
      429: 10005, // 请求过于频繁
    };
    return codeMap[status] || 30001;
  }
}