import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { Documento } from './documento.entity';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
@Entity('documento_auditoria')
export class DocumentoAuditoria {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Field()
  @Column({ type: 'varchar', length: 15 })
  accion!: string;

  @Field(() => GraphQLJSON)
  @Column({ type: 'json' })
  detalles!: any;

  @Field()
  @Column({ type: 'uuid' })
  usuario_id!: string;

  @Field()
  @CreateDateColumn({ type: 'timestamp with time zone' })
  created_at!: Date;

  @Field()
  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updated_at!: Date;

  @Field({ nullable: true })
  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deleted_at?: Date;

  @Field(() => Documento)
  @ManyToOne(() => Documento, (documento) => documento.documentoAuditoria)
  documento!: Documento;

  @Column()
  documentoId!: string;
}
