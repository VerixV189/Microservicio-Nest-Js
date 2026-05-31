import { ObjectType, Field } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Documento } from './documento.entity';

@ObjectType()
@Entity('documento_entidad')
export class DocumentoEntidad {
  @Field()
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ type: 'varchar', length: 50 })
  entidad_tipo!: string;

  @Field()
  @Column({ type: 'uuid' })
  entidad_id!: string;

  @Field(() => Documento)
  @ManyToOne(() => Documento, (documento) => documento.documentoEntidad)
  documento!: Documento;

  @Column()
  documentoId!: string;
}
