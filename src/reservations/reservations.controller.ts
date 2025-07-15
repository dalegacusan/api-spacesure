// src/reservations/reservations.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/libs/enums/roles.enum';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ReservationsService } from './reservations.service';

@Controller('reservations')
@UseGuards(RolesGuard)
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('history')
  @Roles(UserRole.DRIVER)
  async getHistory(@Request() req) {
    return this.reservationsService.getDriverHistory(req.user._id);
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async getAllReservations() {
    return this.reservationsService.getAllReservations();
  }

  @Post()
  @Roles(UserRole.DRIVER)
  async create(@Request() req, @Body() dto: CreateReservationDto) {
    return this.reservationsService.createReservation(req.user._id, dto);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async cancelReservation(@Param('id') id: string) {
    return this.reservationsService.cancelReservation(id);
  }

  @Patch(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async completeReservation(@Param('id') id: string) {
    return this.reservationsService.completeReservation(id);
  }
}
