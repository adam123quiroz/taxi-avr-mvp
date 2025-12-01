import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);
	const logger = new Logger('Bootstrap');

	// CORS
	app.enableCors();

	// Validación MENOS estricta
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			transform: true,
			forbidNonWhitelisted: false,  // ← Cambiar a false
			skipMissingProperties: true,   // ← Agregar esto
		}),
	);

	// Global prefix
	app.setGlobalPrefix('api');

	const port = 3000;
	await app.listen(port);

	logger.log(`🚀 Backend AVR corriendo en puerto ${port}`);
	logger.log(`🌍 Entorno: ${process.env.NODE_ENV}`);
	logger.log(`📞 Webhook: http://localhost:${port}/api/calls/webhook`);
	logger.log(`📊 Stats: http://localhost:${port}/api/calls/stats`);
}

bootstrap();
