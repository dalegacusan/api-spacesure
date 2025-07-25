import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/libs/crypto/crypto.module';
import {
  ParkingSpace,
  Payment,
  Reservation,
  ReservedSlot,
  Vehicle,
} from 'src/libs/entities';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Vehicle,
      ParkingSpace,
      Reservation,
      Payment,
      ReservedSlot,
    ]),
    CryptoModule,
  ],
  providers: [ReservationsService],
  controllers: [ReservationsController],
})
export class ReservationsModule {}
