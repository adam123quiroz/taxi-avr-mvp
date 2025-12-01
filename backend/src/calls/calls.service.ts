import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Call } from './entities/call.entity';
import { Transcript } from './entities/transcript.entity';
import { WebhookEventDto } from './dto/webhook-event.dto';

@Injectable()
export class CallsService {
	private readonly logger = new Logger(CallsService.name);

	constructor(
		@InjectRepository(Call)
		private callsRepository: Repository<Call>,

		@InjectRepository(Transcript)
		private transcriptsRepository: Repository<Transcript>,
	) {}

	async handleWebhookEvent(eventDto: WebhookEventDto) {
		this.logger.log(`📥 Evento recibido: ${eventDto.event} - UUID: ${eventDto.uuid}`);

		switch (eventDto.event) {
			case 'call_started':
				return await this.handleCallStarted(eventDto);

			case 'transcription':
				return await this.handleTranscription(eventDto);

			case 'call_ended':
				return await this.handleCallEnded(eventDto);

			case 'error':
				return await this.handleError(eventDto);

			default:
				this.logger.warn(`⚠️ Evento desconocido: ${eventDto.event}`);
				return { success: false, message: 'Evento desconocido' };
		}
	}

	private async handleCallStarted(eventDto: WebhookEventDto) {
		const call = this.callsRepository.create({
			uuid: eventDto.uuid,
			callerNumber: eventDto.data?.caller_number,
			startTime: new Date(),
			status: 'active',
			metadata: eventDto.data,
		});

		await this.callsRepository.save(call);

		this.logger.log(`✅ Llamada iniciada: ${eventDto.uuid}`);
		return { success: true, message: 'Call started' };
	}

	private async handleTranscription(eventDto: WebhookEventDto) {
		const transcript = this.transcriptsRepository.create({
			callUuid: eventDto.uuid,
			text: eventDto.data?.text,
			speaker: eventDto.data?.is_user ? 'user' : 'agent',
			timestamp: new Date(eventDto.data?.timestamp || Date.now()),
		});

		await this.transcriptsRepository.save(transcript);

		this.logger.log(`💬 Transcripción guardada para: ${eventDto.uuid}`);
		return { success: true, message: 'Transcription saved' };
	}

	private async handleCallEnded(eventDto: WebhookEventDto) {
		const call = await this.callsRepository.findOne({
			where: { uuid: eventDto.uuid },
		});

		if (call) {
			call.endTime = new Date();
			call.duration = eventDto.data?.duration;
			call.status = 'completed';

			await this.callsRepository.save(call);

			this.logger.log(`✅ Llamada finalizada: ${eventDto.uuid} - Duración: ${call.duration}s`);
		}

		return { success: true, message: 'Call ended' };
	}

	private async handleError(eventDto: WebhookEventDto) {
		this.logger.error(`❌ Error en llamada ${eventDto.uuid}: ${JSON.stringify(eventDto.data)}`);

		const call = await this.callsRepository.findOne({
			where: { uuid: eventDto.uuid },
		});

		if (call) {
			call.status = 'error';
			call.metadata = { ...call.metadata, error: eventDto.data };
			await this.callsRepository.save(call);
		}

		return { success: true, message: 'Error logged' };
	}

	// ==========================================
	// API REST - Consultas
	// ==========================================

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
