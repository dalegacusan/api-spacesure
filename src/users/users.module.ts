import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ParkingSpace,
  ParkingSpaceAdmin,
  Payment,
  Reservation,
  User,
  Vehicle,
} from 'src/libs/entities';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Reservation,
      Vehicle,
      Payment,
      ParkingSpace,
      ParkingSpaceAdmin,
    ]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
