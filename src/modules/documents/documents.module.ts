import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentsResolver } from './documents.resolver';
import { Documento } from './entities/documento.entity';
import { DocumentoAuditoria } from './entities/documento-auditoria.entity';
import { DocumentoEntidad } from './entities/documento-entidad.entity';
import { DocumentoPermiso } from './entities/documento-permiso.entity';

import { StorageModule } from '../storage/storage.module';
import { DocumentsService } from './documents.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Documento,
      DocumentoAuditoria,
      DocumentoEntidad,
      DocumentoPermiso,
    ]),
    StorageModule, // <-- ¡Importamos el storage!
  ],
  providers: [DocumentsResolver, DocumentsService], // <-- Registramos el servicio
})
export class DocumentsModule {}
