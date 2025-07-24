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
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ParkingSpace,
      Reservation,
      Payment,
      Vehicle,
    ]),
    CryptoModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
