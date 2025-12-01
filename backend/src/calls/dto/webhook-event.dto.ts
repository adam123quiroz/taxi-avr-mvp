import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';

export class WebhookEventDto {
	@IsString()
	@IsNotEmpty()
	event: string;

	@IsString()
	@IsNotEmpty()
	uuid: string;

	@IsObject()
	@IsOptional()
	data?: any;

	@IsString()
	@IsOptional()
	timestamp?: string;
}
