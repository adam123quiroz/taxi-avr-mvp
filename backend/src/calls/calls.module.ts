import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';
import { Call } from './entities/call.entity';
import { Transcript } from './entities/transcript.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Call, Transcript])],
	controllers: [CallsController],
	providers: [CallsService],
})
export class CallsModule {}
