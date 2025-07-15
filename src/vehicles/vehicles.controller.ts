// src/vehicles/vehicles.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/libs/enums/roles.enum';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehiclesService } from './vehicles.service';

@Controller('vehicles')
@UseGuards(RolesGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @Roles(UserRole.DRIVER)
  async addMyVehicle(@Request() req, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.addVehicle(req.user._id, dto);
  }

  @Get()
  @Roles(UserRole.DRIVER)
  async getMyVehicles(@Request() req) {
    return this.vehiclesService.findByUser(req.user._id);
  }

  @Get(':id')
  @Roles(UserRole.DRIVER)
  async getMyVehicle(@Request() req, @Param('id') id: string) {
    return this.vehiclesService.findOneById(id, req.user._id);
  }

  @Delete(':id')
  @Roles(UserRole.DRIVER)
  async deleteMyVehicle(@Request() req, @Param('id') id: string) {
    return this.vehiclesService.deleteVehicle(id, req.user._id);
  }

  @Put(':id')
  @Roles(UserRole.DRIVER)
  async updateMyVehicle(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateVehicle(id, req.user._id, dto);
  }
}
