// src/vehicles/vehicles.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { Reservation } from 'src/libs/entities';
import { Vehicle } from 'src/libs/entities/vehicle.entity';
import { Repository } from 'typeorm';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(Reservation)
    private readonly reservationRepo: Repository<Reservation>,
  ) {}

  async addVehicle(userId: string, dto: CreateVehicleDto) {
    const newVehicle = this.vehicleRepo.create({
      vehicle_type: dto.vehicle_type,
      year_make_model: dto.year_make_model,
      color: dto.color,
      plate_number: dto.plate_number,
      user_id: new ObjectId(userId),
    });

    const saved = await this.vehicleRepo.save(newVehicle);
    return {
      message: 'Vehicle added successfully',
      data: { vehicle: saved },
    };
  }

  async findOneById(vehicleId: string, userId: string) {
    const vehicle = await this.vehicleRepo.findOne({
      where: { _id: new ObjectId(vehicleId), user_id: new ObjectId(userId) },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async findByUser(userId: string) {
    try {
      const objectId = new ObjectId(userId);
      return await this.vehicleRepo.find({ where: { user_id: objectId } });
    } catch {
      return [];
    }
  }

  async deleteVehicle(vehicleId: string, userId: string) {
    const vehicle = await this.vehicleRepo.findOne({
      where: { _id: new ObjectId(vehicleId) },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.user_id.toString() !== userId)
      throw new ForbiddenException('User is not authorized to delete vehicle');

    const reservationCount = await this.reservationRepo.count({
      where: { vehicle_id: new ObjectId(vehicleId) },
    });

    if (reservationCount > 0)
      throw new ForbiddenException(
        'Cannot delete vehicle with existing reservations',
      );

    await this.vehicleRepo.delete(vehicle._id);
    return { message: 'Vehicle deleted successfully' };
  }

  async updateVehicle(
    vehicleId: string,
    userId: string,
    dto: UpdateVehicleDto,
  ) {
    const vehicle = await this.vehicleRepo.findOne({
      where: { _id: new ObjectId(vehicleId) },
    });

    if (!vehicle) throw new NotFoundException('Vehicle not found');
    if (vehicle.user_id.toString() !== userId)
      throw new ForbiddenException('Unauthorized');

    await this.vehicleRepo.update(vehicle._id, {
      ...dto,
      updated_at: new Date(),
    });

    return { message: 'Vehicle updated successfully' };
  }
}
