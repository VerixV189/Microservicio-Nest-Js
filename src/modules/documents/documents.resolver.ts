import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UseGuards, BadRequestException } from '@nestjs/common';
import { Documento } from './entities/documento.entity';
import { DocumentoAuditoria } from './entities/documento-auditoria.entity';
import { DocumentsService } from './documents.service';
import { GraphQLUpload, FileUpload } from 'graphql-upload-ts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// Validaciones por defecto (puedes ajustarlas)
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'text/plain',
  'application/zip',
];

@Resolver(() => Documento)
export class DocumentsResolver {
  constructor(private readonly documentsService: DocumentsService) {}

  @Query(() => [Documento], { name: 'obtenerDocumentos' })
  findAll(): Documento[] {
    return [];
  }

  // @UseGuards(JwtAuthGuard)
  @Mutation(() => Documento)
  async subirDocumento(
    @Args({ name: 'file', type: () => GraphQLUpload })
    file: Promise<FileUpload>,
    @Args('usuarioId') usuarioId: string,
  ): Promise<Documento> {
    const resolvedFile = await file;
    const { filename, mimetype } = resolvedFile;

    // Validación básica de MIME
    if (!ALLOWED_MIME.includes(mimetype)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido: ${mimetype}`,
      );
    }

    const stream = resolvedFile.createReadStream();
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    for await (const rawChunk of stream) {
      // Forzamos el tipado para evitar el tipo 'any' que molesta a ESLint
      const chunk = rawChunk as Uint8Array | Buffer;

      const bytes = Buffer.isBuffer(chunk) ? chunk.length : chunk.byteLength;
      totalBytes += bytes;

      if (totalBytes > MAX_FILE_SIZE_BYTES) {
        throw new BadRequestException(
          'El archivo excede el tamaño máximo permitido',
        );
      }
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    return this.documentsService.crearDocumentoDesdeBuffer(
      filename,
      mimetype,
      buffer,
      usuarioId,
    );
  }

  // @UseGuards(JwtAuthGuard)
  @Query(() => String, { name: 'obtenerLinkDocumento' })
  async obtenerUrl(
    @Args('documentoId') id: string,
    @Args('usuarioId') usuarioId: string,
  ): Promise<string> {
    return this.documentsService.obtenerLinkDescarga(id, usuarioId);
  }
  // @UseGuards(JwtAuthGuard)
  @Mutation(() => Boolean, { name: 'eliminarDocumento' })
  async eliminarDocumento(
    @Args('documentoId') documentoId: string,
    @Args('usuarioId') usuarioId: string,
  ): Promise<boolean> {
    return this.documentsService.eliminarDocumento(documentoId, usuarioId);
  }

  @Query(() => [DocumentoAuditoria], { name: 'listarAuditoria' })
  async listarAuditoria(
    @Args('documentoId') documentoId: string,
  ): Promise<DocumentoAuditoria[]> {
    return this.documentsService.listarAuditoria(documentoId);
  }

  @Query(() => [DocumentoAuditoria], { name: 'listarAuditoriaGlobal' })
  async listarAuditoriaGlobal(
    @Args('limite', { type: () => Int, nullable: true }) limite?: number,
  ): Promise<DocumentoAuditoria[]> {
    return this.documentsService.listarAuditoriaGlobal(limite ?? 50);
  }
}
