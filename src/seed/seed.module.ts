import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ParkingSpace,
  ParkingSpaceAdmin,
  Reservation,
  User,
  Vehicle,
} from 'src/libs/entities';
import { SeedController } from './seed.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Vehicle,
      Reservation,
      ParkingSpace,
      ParkingSpaceAdmin,
    ]),
  ],
  controllers: [SeedController],
})
export class SeedModule {}
