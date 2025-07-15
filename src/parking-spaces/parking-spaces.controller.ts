import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/libs/enums/roles.enum';
import { CreateParkingSpaceDto } from './dto/create-parking-space.dto';
import { UpdateParkingSpaceDto } from './dto/update-parking-space.dto';
import { ParkingSpacesService } from './parking-spaces.service';

@Controller('parking-spaces')
@UseGuards(RolesGuard)
export class ParkingSpacesController {
  constructor(private readonly parkingService: ParkingSpacesService) {}

  @Get()
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getAll(
    @Req() req: Request,
    @Query('location') location?: string,
    @Query('unassigned') unassigned?: string,
    @Query('userId') userId?: string,
  ) {
    // @ts-ignore
    const user = req.user as { _id: string; email: string; role: UserRole };

    const isUnassigned = unassigned === 'true';

    if (user.role === UserRole.ADMIN) {
      return this.parkingService.getParkingSpacesByAdminId(user._id);
    }

    return this.parkingService.getParkingSpaces(
      user._id,
      location,
      isUnassigned,
      userId,
    );
  }

  @Get(':id')
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async getParkingSpaceById(@Param('id') id: string, @Req() req: Request) {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid parking space ID');
    }

    // @ts-ignore
    const user = req.user as { _id: string; role: UserRole };

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      const space = await this.parkingService.getOneWithReservations(id);
      if (!space) {
        throw new NotFoundException('Parking space not found');
      }
      return space;
    }

    const space = await this.parkingService.getOne(id, user._id);
    if (!space) {
      throw new NotFoundException('Parking space not found');
    }

    return space;
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateParkingSpace(
    @Param('id') id: string,
    @Body() dto: UpdateParkingSpaceDto,
  ) {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid parking space ID');
    }

    const updated = await this.parkingService.updateOne(id, dto);
    if (!updated) {
      throw new NotFoundException('Parking space not found');
    }

    return updated;
  }

  @Get('admin/:id')
  @Roles(UserRole.SUPER_ADMIN)
  async getOneForSuperAdmin(@Param('id') id: string) {
    if (!ObjectId.isValid(id)) {
      throw new NotFoundException('Invalid parking space ID');
    }

    const space = await this.parkingService.getOneWithReservations(id);

    if (!space) {
      throw new NotFoundException('Parking space not found');
    }

    return space;
  }

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
  async createParkingSpace(@Body() dto: CreateParkingSpaceDto) {
    return this.parkingService.createOne(dto);
  }
}
