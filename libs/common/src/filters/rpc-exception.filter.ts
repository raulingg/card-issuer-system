import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { throwError } from 'rxjs';

@Catch(RpcException)
export class RpcExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(RpcExceptionFilter.name);

  catch(exception: RpcException, _host: ArgumentsHost) {
    const error = exception.getError();
    this.logger.error('RPC Exception', JSON.stringify(error));
    return throwError(() => error);
  }
}
