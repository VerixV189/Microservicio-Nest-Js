import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Documento } from './documento.entity';

// Enum que define los niveles de acceso válidos al documento
export enum NivelAcceso {
  PROPIETARIO = 'PROPIETARIO',
  LECTURA = 'LECTURA',
  ESCRITURA = 'ESCRITURA',
}

// Registramos el enum para que GraphQL lo reconozca
registerEnumType(NivelAcceso, {
  name: 'NivelAcceso',
  description: 'Nivel de acceso de un usuario sobre un documento',
});

@ObjectType()
@Entity('documento_permiso')
export class DocumentoPermiso {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field(() => NivelAcceso)
  @Column({
    type: 'varchar',
    length: 15,
    enum: NivelAcceso,
  })
  nivel_acceso!: NivelAcceso;

  @Field()
  @Column({ type: 'uuid' })
  usuario_id!: string;

  @Field()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Field(() => Documento)
  @ManyToOne(() => Documento, (documento) => documento.documentoPermiso)
  documento!: Documento;

  @Column()
  documentoId!: string;
}
