import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { CallsService } from './calls.service';

@Controller('calls')
export class CallsController {
	private readonly logger = new Logger(CallsController.name);

	constructor(private readonly callsService: CallsService) {}

	@Post('webhook')
	async handleWebhook(@Body() eventDto: any) {  // ← Cambiar a 'any' temporalmente
		this.logger.log(`📥 Webhook recibido: ${JSON.stringify(eventDto)}`);
		try {
			return await this.callsService.handleWebhookEvent(eventDto);
		} catch (error) {
			this.logger.error(`❌ Error procesando webhook: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	@Get()
	async getAllCalls() {
		return await this.callsService.getAllCalls();
	}

	@Get('stats')
	async getStats() {
		return await this.callsService.getStats();
	}

	@Get(':uuid')
	async getCall(@Param('uuid') uuid: string) {
		return await this.callsService.getCallById(uuid);
	}

	@Get(':uuid/transcripts')
	async getTranscripts(@Param('uuid') uuid: string) {
		return await this.callsService.getCallTranscripts(uuid);
	}
}
