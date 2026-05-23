import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';

export interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | undefined
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T> | undefined> {
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data) => {
        if (
          response.statusCode === 204 ||
          data === undefined ||
          data === null
        ) {
          return undefined;
        }

        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
