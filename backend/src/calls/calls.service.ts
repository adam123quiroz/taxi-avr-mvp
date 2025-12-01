import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call } from './entities/call.entity';
import { Transcript } from './entities/transcript.entity';

@Injectable()
export class CallsService {
	private readonly logger = new Logger(CallsService.name);

	constructor(
		@InjectRepository(Call)
		private callsRepository: Repository<Call>,

		@InjectRepository(Transcript)
		private transcriptsRepository: Repository<Transcript>,
	) {}

	async handleWebhookEvent(eventDto: any) {
		// AVR envía "type" no "event"
		const eventType = eventDto.type || eventDto.event;

		this.logger.log(`📥 Evento recibido: ${eventType} - UUID: ${eventDto.uuid}`);

		switch (eventType) {
			case 'call_started':
				return await this.handleCallStarted(eventDto);

			case 'transcription':
				return await this.handleTranscription(eventDto);

			case 'call_ended':
				return await this.handleCallEnded(eventDto);

			case 'error':
				return await this.handleError(eventDto);

			default:
				this.logger.warn(`⚠️ Evento desconocido: ${eventType}`);
				return { success: true, message: 'Evento ignorado' };
		}
	}

	private async handleCallStarted(eventDto: any) {
		const call = this.callsRepository.create({
			uuid: eventDto.uuid,
			callerNumber: eventDto.payload?.caller_number || 'unknown',
			startTime: new Date(eventDto.timestamp),
			status: 'active',
			metadata: eventDto.payload || {},
		});

		await this.callsRepository.save(call);

		this.logger.log(`✅ Llamada iniciada: ${eventDto.uuid}`);
		return { success: true, message: 'Call started' };
	}

	private async handleTranscription(eventDto: any) {
		const transcript = this.transcriptsRepository.create({
			callUuid: eventDto.uuid,
			text: eventDto.payload?.text || '',
			speaker: eventDto.payload?.is_user ? 'user' : 'agent',
			timestamp: new Date(eventDto.timestamp),
		});

		await this.transcriptsRepository.save(transcript);

		this.logger.log(`💬 Transcripción guardada para: ${eventDto.uuid}`);
		return { success: true, message: 'Transcription saved' };
	}

	private async handleCallEnded(eventDto: any) {
		const call = await this.callsRepository.findOne({
			where: { uuid: eventDto.uuid },
		});

		if (call) {
			const endTime = new Date(eventDto.timestamp);
			const duration = Math.floor((endTime.getTime() - call.startTime.getTime()) / 1000);

			call.endTime = endTime;
			call.duration = duration;
			call.status = 'completed';

			await this.callsRepository.save(call);

			this.logger.log(`✅ Llamada finalizada: ${eventDto.uuid} - Duración: ${duration}s`);
		}

		return { success: true, message: 'Call ended' };
	}

	private async handleError(eventDto: any) {
		this.logger.error(`❌ Error en llamada ${eventDto.uuid}: ${JSON.stringify(eventDto.payload)}`);

		const call = await this.callsRepository.findOne({
			where: { uuid: eventDto.uuid },
		});

		if (call) {
			call.status = 'error';
			call.metadata = { ...call.metadata, error: eventDto.payload };
			await this.callsRepository.save(call);
		}

		return { success: true, message: 'Error logged' };
	}

	async getAllCalls() {
		return await this.callsRepository.find({
			order: { startTime: 'DESC' },
			take: 50,
		});
	}

	async getCallById(uuid: string) {
		return await this.callsRepository.findOne({
			where: { uuid },
			relations: ['transcripts'],
		});
	}

	async getCallTranscripts(uuid: string) {
		return await this.transcriptsRepository.find({
			where: { callUuid: uuid },
			order: { timestamp: 'ASC' },
		});
	}

	async getStats() {
		const totalCalls = await this.callsRepository.count();
		const activeCalls = await this.callsRepository.count({
			where: { status: 'active' },
		});
		const completedCalls = await this.callsRepository.count({
			where: { status: 'completed' },
		});

		const avgDuration = await this.callsRepository
			.createQueryBuilder('call')
			.select('AVG(call.duration)', 'avg')
			.where('call.status = :status', { status: 'completed' })
			.getRawOne();

		return {
			totalCalls,
			activeCalls,
			completedCalls,
			averageDuration: Math.round(avgDuration?.avg || 0),
		};
	}
}
