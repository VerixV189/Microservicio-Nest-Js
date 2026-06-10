import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { graphqlUploadExpress } from 'graphql-upload-ts';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para permitir peticiones desde Angular
  app.enableCors({
    origin: 'http://localhost:4200', // o '*' para permitir todo
    credentials: true,
  });

  // Habilitamos el middleware para manejar subida de archivos (multipart)
  app.use(
    graphqlUploadExpress({ maxFileSize: 10 * 1024 * 1024, maxFiles: 10 }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
