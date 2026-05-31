import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  /**
   * Al igual que en el decorador, usamos el genérico oficial de NestJS
   * para tipar el contexto de fondo sin usar aserciones manuales.
   */
  override getRequest(context: ExecutionContext): unknown {
    const ctx = GqlExecutionContext.create(context);

    // Le indicamos nativamente a NestJS qué estructura esperar del contexto
    const args = ctx.getContext<{ req?: unknown }>();

    return args.req ?? {};
  }
  /**
   * Validación estricta con formato multilínea estándar para Prettier
   */
  override handleRequest<TUser = string>(err: unknown, user: unknown): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      throw new UnauthorizedException(
        'No autorizado: Token ausente o inválido',
      );
    }

    return user as TUser;
  }
}
