import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ParkingSpace,
  ParkingSpaceAdmin,
  Reservation,
  User,
} from 'src/libs/entities';
import { ParkingSpacesController } from './parking-spaces.controller';
import { ParkingSpacesService } from './parking-spaces.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      ParkingSpace,
      ParkingSpaceAdmin,
      Reservation,
    ]),
  ],
  providers: [ParkingSpacesService],
  controllers: [ParkingSpacesController],
})
export class ParkingSpacesModule {}
