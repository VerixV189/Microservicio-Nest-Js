import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class StorageService {
  private readonly s3Client: S3Client;
  private readonly bucketName: string;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    this.bucketName = this.configService.get<string>(
      'AWS_S3_BUCKET',
      'mi-bucket-local',
    );

    // Configuración para Flocci (Local) o AWS (Producción)
    this.s3Client = new S3Client({
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      endpoint: this.configService.get<string>('AWS_S3_ENDPOINT'), // vital para Flocci
      credentials: {
        accessKeyId: this.configService.get<string>(
          'AWS_ACCESS_KEY_ID',
          'test',
        ),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
          'test',
        ),
      },
      // forcePathStyle debe ser true para herramientas locales estilo S3 como Flocci/MinIO
      forcePathStyle: true,
    });
  }

  /**
   * Sube un archivo a S3/Flocci
   * fileBuffer: Los datos en crudo del archivo
   * fileName: El nombre/ruta con el que se guardará (S3 Key)
   * mimeType: El tipo (ej. image/png, application/pdf)
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo subido exitosamente: ${fileName}`);

      return fileName;
    } catch (error) {
      this.logger.error(`Error subiendo archivo ${fileName}:`, error);
      throw new Error(`Error al subir el archivo al almacenamiento.`);
    }
  }

  /**
   * Genera una URL temporal (Presigned URL) para descargar/ver el archivo de forma segura
   */
  async getPresignedUrl(
    fileName: string,
    expiresInSeconds = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      // url firmada válida por 1 hora por defecto
      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: expiresInSeconds,
      });
      return url;
    } catch (error) {
      this.logger.error(
        `Error generando Presigned URL para ${fileName}:`,
        error,
      );
      throw new Error(`Error al generar enlace de descarga.`);
    }
  }

  /**
   * Elimina un archivo de S3/Flocci
   */
  async deleteFile(fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
      this.logger.log(`Archivo eliminado de S3 exitosamente: ${fileName}`);
    } catch (error) {
      this.logger.error(`Error eliminando archivo ${fileName}:`, error);
      // No lanzamos error aquí para no interrumpir el flujo de limpieza
    }
  }
}
