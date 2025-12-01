export default () => ({
	// Entorno
	nodeEnv: process.env.NODE_ENV || 'development',
	port: parseInt(process.env.PORT || '3000', 10),

	// Base de datos
	database: {
		host: process.env.DATABASE_HOST || 'localhost',
		port: parseInt(process.env.DATABASE_PORT || '5432', 10),
		username: process.env.DATABASE_USER || 'avruser',
		password: process.env.DATABASE_PASSWORD || 'password',
		database: process.env.DATABASE_NAME || 'avrdb',
		synchronize: process.env.NODE_ENV === 'development', // Solo en desarrollo
		logging: process.env.NODE_ENV === 'development',
	},

	// Webhook
	webhook: {
		secret: process.env.WEBHOOK_SECRET || 'default_secret_change_me',
	},

	// OpenAI (opcional, si quieres llamar directamente desde NestJS)
	openai: {
		apiKey: process.env.OPENAI_API_KEY,
		model: process.env.OPENAI_MODEL || 'gpt-4o-realtime-preview-2024-12-17',
	},

	// AVR Core (opcional, para hacer llamadas salientes)
	avr: {
		coreUrl: process.env.AVR_CORE_URL || 'http://avr-core:5001',
		asteriskUrl: process.env.ASTERISK_URL || 'asterisk:5060',
	},

	// Logging
	logging: {
		level: process.env.LOG_LEVEL || 'info',
		prettyPrint: process.env.NODE_ENV === 'development',
	},

	// CORS
	cors: {
		enabled: process.env.CORS_ENABLED !== 'false',
		origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
	},
});
