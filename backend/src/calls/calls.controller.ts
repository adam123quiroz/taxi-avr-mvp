import { Controller, Post, Get, Body, Param, Logger } from '@nestjs/common';
import { CallsService } from './calls.service';
import { WebhookEventDto } from './dto/webhook-event.dto';

@Controller('api/calls')
export class CallsController {
	private readonly logger = new Logger(CallsController.name);

	constructor(private readonly callsService: CallsService) {}

	// ==========================================
	// WEBHOOK - Recibe eventos de AVR Core
	// ==========================================
	@Post('webhook')
	async handleWebhook(@Body() eventDto: WebhookEventDto) {
		return await this.callsService.handleWebhookEvent(eventDto);
	}

	// ==========================================
	// API REST - Endpoints de consulta
	// ==========================================

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
