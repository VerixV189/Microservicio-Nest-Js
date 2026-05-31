import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
    return {
      type: 'postgres',
      host: configService.get<string>('DB_HOST', 'localhost'),
      port: configService.get<number>('DB_PORT', 5432),
      username: configService.get<string>('DB_USER', 'postgres'),
      password: configService.get<string>('DB_PASSWORD', 'postgres'),
      database: configService.get<string>('DB_NAME', 'postgres'),

      // Busca automáticamente cualquier entidad (.entity.ts) dentro de la carpeta /src
      entities: [__dirname + '/../**/*.entity.{js,ts}'],

      // synchronize en 'true' creará las tablas automáticamente basado en tus entidades.
      // ¡ATENCIÓN! No usar en producción porque puede borrar o alterar datos inadvertidamente.
      synchronize: configService.get<string>('NODE_ENV') !== 'production',

      // Muestra las consultas SQL en la consola (útil para desarrollo)
      logging: configService.get<string>('NODE_ENV') === 'development',
    };
  },
};
