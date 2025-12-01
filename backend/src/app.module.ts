import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsModule } from './calls/calls.module';
import configuration from './config/configuration';

@Module({
	imports: [
		// Configuración global
		ConfigModule.forRoot({
			isGlobal: true,
			load: [configuration],
			envFilePath: ['.env.local', '.env'],
		}),

		// Base de datos con configuración dinámica
		TypeOrmModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				type: 'postgres',
				host: configService.get('database.host'),
				port: configService.get('database.port'),
				username: configService.get('database.username'),
				password: configService.get('database.password'),
				database: configService.get('database.database'),
				entities: [__dirname + '/**/*.entity{.ts,.js}'],
				synchronize: configService.get('database.synchronize'),
				logging: configService.get('database.logging'),
			}),
			inject: [ConfigService],
		}),

		// Módulos
		CallsModule,
	],
})
export class AppModule {}
