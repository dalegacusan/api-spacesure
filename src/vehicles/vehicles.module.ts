import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reservation } from 'src/libs/entities';
import { Vehicle } from 'src/libs/entities/vehicle.entity';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, Reservation])],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
