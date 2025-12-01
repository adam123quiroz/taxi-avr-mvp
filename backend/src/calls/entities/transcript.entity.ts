import {
	Entity,
	Column,
	PrimaryGeneratedColumn,
	CreateDateColumn,
	ManyToOne,
	JoinColumn,
} from 'typeorm';
import { Call } from './call.entity';

@Entity('transcripts')
export class Transcript {
	@PrimaryGeneratedColumn('uuid')
	id: string;

	@Column()
	callUuid: string;

	@Column('text')
	text: string;

	@Column()
	speaker: string; // 'user' o 'agent'

	@Column({ type: 'timestamp' })
	timestamp: Date;

	@ManyToOne(() => Call, (call) => call.transcripts)
	@JoinColumn({ name: 'callUuid', referencedColumnName: 'uuid' })
	call: Call;

	@CreateDateColumn()
	createdAt: Date;
}
