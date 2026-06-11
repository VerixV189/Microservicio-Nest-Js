import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Documento } from './entities/documento.entity';
import { DocumentoAuditoria } from './entities/documento-auditoria.entity';
import { ForbiddenException } from '@nestjs/common';
import {
  DocumentoPermiso,
  NivelAcceso,
} from './entities/documento-permiso.entity';
import { StorageService } from '../storage/storage.service';
import { BlockchainService } from '../blockchain/blockchain.service';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    @InjectRepository(Documento)
    private readonly documentoRepository: Repository<Documento>,
    private readonly storageService: StorageService,
    private readonly dataSource: DataSource,
    private readonly blockchainService: BlockchainService,
  ) {}

  async crearDocumentoDesdeBuffer(
    nombreOriginal: string,
    mimeType: string,
    buffer: Buffer,
    usuarioId: string, // UUID del usuario que lo sube (como es microservicio, lo pasará el otro MS)
  ): Promise<Documento> {
    // 1. Generar un nombre único (s3_key) para evitar sobreescribir archivos con el mismo nombre
    const extension = nombreOriginal.split('.').pop();
    const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
    const s3Key = `documentos/${uniqueFileName}`;

    // 2. Subir el archivo físicamente a Flocci / S3
    await this.storageService.uploadFile(buffer, s3Key, mimeType);

    // Iniciamos la transacción para guardar en DB
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3. Guardar el registro en nuestra tabla de Postgres
      const nuevoDocumento = queryRunner.manager.create(Documento, {
        nombre_original: nombreOriginal,
        s3_key: s3Key,
        mime_type: mimeType,
        tamano_bytes: BigInt(buffer.length),
        creado_por: usuarioId,
        estado: 'ACTIVO',
      });
      const documentoGuardado = await queryRunner.manager.save(nuevoDocumento);

      // 4. Registrar la auditoría de creación
      const auditoria = queryRunner.manager.create(DocumentoAuditoria, {
        accion: 'CREACION',
        detalles: {
          nombreOriginal,
          mimeType,
          tamano: buffer.length,
          s3Key,
        },
        usuario_id: usuarioId,
        documento: documentoGuardado,
      });
      await queryRunner.manager.save(auditoria);

      // Registrar en el blockchain
      await this.blockchainService.registrarTransaccion(
        `DOCUMENT_AUDIT_${documentoGuardado.id}`,
        {
          accion: 'CREACION',
          documentoId: documentoGuardado.id,
          nombreOriginal,
          mimeType,
          tamano: buffer.length,
          usuarioId,
          s3Key,
        },
      );

      // 5. Asignar al usuario que sube como PROPIETARIO del documento
      const permiso = queryRunner.manager.create(DocumentoPermiso, {
        nivel_acceso: NivelAcceso.PROPIETARIO,
        usuario_id: usuarioId,
        documento: documentoGuardado,
      });
      await queryRunner.manager.save(permiso);

      await queryRunner.commitTransaction();
      return documentoGuardado;
    } catch (error) {
      // Si falla la BD, deshacemos la transacción y ELIMINAMOS el archivo huérfano en S3
      await queryRunner.rollbackTransaction();
      this.logger.error(
        'Error en la transacción de creación de documento, eliminando de S3...',
        error,
      );
      await this.storageService.deleteFile(s3Key);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Obtener el link seguro de descarga
  async obtenerLinkDescarga(
    documentoId: string,
    usuarioId: string,
  ): Promise<string> {
    await this.verificarPermiso(documentoId, usuarioId, [
      NivelAcceso.PROPIETARIO,
      NivelAcceso.ESCRITURA,
      NivelAcceso.LECTURA,
    ]);

    const doc = await this.documentoRepository.findOne({
      where: { id: documentoId },
    });
    if (!doc) {
      throw new Error('Documento no encontrado');
    }

    await this.dataSource.getRepository(DocumentoAuditoria).save({
      accion: 'DESCARGA_URL_GENERADA',
      detalles: { s3Key: doc.s3_key },
      usuario_id: usuarioId,
      documento: doc,
    });

    // Registrar en el blockchain
    await this.blockchainService.registrarTransaccion(
      `DOCUMENT_AUDIT_${doc.id}`,
      {
        accion: 'DESCARGA_URL_GENERADA',
        documentoId: doc.id,
        usuarioId,
        s3Key: doc.s3_key,
      },
    );
    // Devuelve un link de Flocci válido por 3600 segundos (1 hora)
    return this.storageService.getPresignedUrl(doc.s3_key);
  }

  // Borrado lógico del documento (Soft Delete)
  async eliminarDocumento(
    documentoId: string,
    usuarioId: string,
  ): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const doc = await queryRunner.manager.findOne(Documento, {
        where: { id: documentoId },
      });
      if (!doc) {
        throw new Error('Documento no encontrado');
      }

      // Soft delete: marca la fecha de borrado y cambia el estado
      doc.estado = 'ELIMINADO_LOGICO';
      await queryRunner.manager.softRemove(doc);

      // Registrar la auditoría de eliminación
      const auditoria = queryRunner.manager.create(DocumentoAuditoria, {
        accion: 'ELIMINACION',
        detalles: {
          s3Key: doc.s3_key,
          nombreOriginal: doc.nombre_original,
        },
        usuario_id: usuarioId,
        documento: doc,
      });
      await queryRunner.manager.save(auditoria);

      // Registrar en el blockchain
      await this.blockchainService.registrarTransaccion(
        `DOCUMENT_AUDIT_${doc.id}`,
        {
          accion: 'ELIMINACION',
          documentoId: doc.id,
          usuarioId,
          s3Key: doc.s3_key,
          nombreOriginal: doc.nombre_original,
        },
      );

      await queryRunner.commitTransaction();
      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('Error al eliminar documento', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // Listar el log de auditoría de un documento
  async listarAuditoria(documentoId: string): Promise<DocumentoAuditoria[]> {
    // Usamos QueryBuilder para filtrar por la relación `documento.id`
    // Esto evita problemas con el nombre físico de la columna FK en distintas configuraciones
    return this.dataSource
      .getRepository(DocumentoAuditoria)
      .createQueryBuilder('a')
      .leftJoin('a.documento', 'd')
      .where('d.id = :id', { id: documentoId })
      .orderBy('a.created_at', 'DESC')
      .getMany();
  }

  // Listar los logs más recientes de toda la plataforma
  async listarAuditoriaGlobal(limite?: number): Promise<DocumentoAuditoria[]> {
    const maxResultados = limite ?? 50;
    return this.dataSource
      .getRepository(DocumentoAuditoria)
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.documento', 'd')
      .orderBy('a.created_at', 'DESC')
      .take(maxResultados)
      .getMany();
  }

  private async verificarPermiso(
    documentoId: string,
    usuarioId: string,
    nivelesPermitidos: NivelAcceso[],
  ): Promise<void> {
    const permiso = await this.dataSource
      .getRepository(DocumentoPermiso)
      .findOne({
        where: {
          documentoId: documentoId,
          usuario_id: usuarioId,
        },
      });

    if (!permiso || !nivelesPermitidos.includes(permiso.nivel_acceso)) {
      throw new ForbiddenException(
        'No tienes los permisos necesarios para realizar esta acción sobre este documento',
      );
    }
  }
}
