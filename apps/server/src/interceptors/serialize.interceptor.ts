import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  UseInterceptors,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ClassConstructor, plainToClass } from 'class-transformer';

// ClassConstructor<object> is the correct bound — all DTOs are objects.
// Using `object` instead of `any` satisfies no-explicit-any while keeping
// the generic flexible enough for any DTO class.
export const Serialize = (dto: ClassConstructor<object>) => {
  return UseInterceptors(new SerializeInterceptor(dto));
};

export class SerializeInterceptor implements NestInterceptor {
  constructor(private dto: ClassConstructor<object>) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<object> {
    return next.handle().pipe(
      map((data: object) => {
        return plainToClass(this.dto, data, {
          excludeExtraneousValues: true,
        });
      }),
    );
  }
}