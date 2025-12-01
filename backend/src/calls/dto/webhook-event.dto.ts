import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class WebhookEventDto {
	@IsString()
	@IsNotEmpty()
	event: string;

	@IsString()
	@IsNotEmpty()
	uuid: string;

	@IsOptional()  // ← Hacer todo opcional
	@IsObject()
	data?: any;

	@IsOptional()
	@IsString()
	timestamp?: string;
}
