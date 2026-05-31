import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';

@Module({
  providers: [StorageService],
  exports: [StorageService], // Exportamos para que `DocumentsModule` pueda usarlo
})
export class StorageModule {}
