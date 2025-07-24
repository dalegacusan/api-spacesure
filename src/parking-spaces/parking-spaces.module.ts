import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CryptoModule } from 'src/libs/crypto/crypto.module';
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
    CryptoModule,
  ],
  providers: [ParkingSpacesService],
  controllers: [ParkingSpacesController],
})
export class ParkingSpacesModule {}
