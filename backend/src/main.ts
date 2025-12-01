import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const configService = app.get(ConfigService);
	const logger = new Logger('Bootstrap');

	// CORS
	if (configService.get('cors.enabled')) {
		app.enableCors({
			origin: configService.get('cors.origins'),
			credentials: true,
		});
		logger.log('✅ CORS habilitado');
	}

	// Validación global
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: true,
		}),
	);

	// Prefix global para API
	app.setGlobalPrefix('api');

	const port = configService.get('port');
	await app.listen(port);

	logger.log(`🚀 Backend AVR corriendo en puerto ${port}`);
	logger.log(`🌍 Entorno: ${configService.get('nodeEnv')}`);
	logger.log(`📞 Webhook: http://localhost:${port}/api/calls/webhook`);
	logger.log(`📊 Stats: http://localhost:${port}/api/calls/stats`);
}

bootstrap();
