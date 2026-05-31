import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentoAuditoria } from './documento-auditoria.entity';
import { DocumentoPermiso } from './documento-permiso.entity';
import { DocumentoEntidad } from './documento-entidad.entity';

@ObjectType()
@Entity('documento')
export class Documento {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string; // Cambiado a string para UUID

  @Field()
  @Column({ type: 'varchar', length: 255 })
  s3_key!: string;

  @Field()
  @Column({ type: 'varchar', length: 255 })
  nombre_original!: string;

  @Field()
  @Column({ type: 'varchar', length: 50 })
  mime_type!: string;

  @Field(() => String)
  @Column({
    type: 'bigint',
    transformer: {
      to: (value: string | bigint | null) => value,
      from: (value: string | bigint | null) => value?.toString(),
    },
  })
  tamano_bytes!: string | bigint;

  @Field()
  @Column({ type: 'uuid' })
  creado_por!: string;

  @Field()
  @Column({ type: 'varchar', length: 20 }) //Estado "ACTIVO, ELIMINADO_LOGICO"
  estado!: string;

  @Field()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Field({ nullable: true })
  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deleted_at?: Date;

  @Field(() => [DocumentoAuditoria])
  @OneToMany(
    () => DocumentoAuditoria,
    (documentoAuditoria) => documentoAuditoria.documento,
  )
  documentoAuditoria!: DocumentoAuditoria[];

  @Field(() => [DocumentoPermiso])
  @OneToMany(
    () => DocumentoPermiso,
    (documentoPermiso) => documentoPermiso.documento,
  )
  documentoPermiso!: DocumentoPermiso[];

  @Field(() => [DocumentoEntidad])
  @OneToMany(
    () => DocumentoEntidad,
    (documentoEntidad) => documentoEntidad.documento,
  )
  documentoEntidad!: DocumentoEntidad[];
}
