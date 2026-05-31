import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): string => {
    // 1. Convertimos el contexto genérico en un contexto de ejecución de GraphQL
    const ctx = GqlExecutionContext.create(context);

    // 2. Usamos el genérico oficial de NestJS para tipar el contexto de Express/Fastify de fondo
    const args = ctx.getContext<{ req?: { user?: string } }>();

    // 3. Retornamos de forma 100% segura y tipada
    return args.req?.user ?? '';
  },
);
