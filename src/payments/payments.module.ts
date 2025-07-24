import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/libs/crypto/crypto.module';
import {
  ParkingSpace,
  Payment,
  Reservation,
  User,
  Vehicle,
} from 'src/libs/entities';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Reservation,
      ParkingSpace,
      User,
      Vehicle,
    ]),
    CryptoModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
