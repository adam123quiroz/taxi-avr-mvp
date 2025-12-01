import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	UpdateDateColumn,
	OneToMany,
} from 'typeorm';
import { Transcript } from './transcript.entity';

@Entity('calls')
export class Call {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column({ unique: true })
	uuid: string;

	@Column({ nullable: true })
	callerNumber: string;

	@Column({ type: 'timestamp' })
	startTime: Date;

	@Column({ type: 'timestamp', nullable: true })
	endTime: Date;

	@Column({ nullable: true })
	duration: number; // en segundos

	@Column({ default: 'active' })
	status: string; // active, completed, error

	@Column({ type: 'jsonb', nullable: true })
	metadata: any;

	@OneToMany(() => Transcript, (transcript) => transcript.call)
	transcripts: Transcript[];

	@CreateDateColumn()
	createdAt: Date;

	@UpdateDateColumn()
	updatedAt: Date;
}
