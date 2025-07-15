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
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsersWithDetails() {
    return this.usersService.getAllUsersWithDetails();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async getOneUser(@Param('id') id: string) {
    return this.usersService.getOneUserWithDetails(id);
  }

  @Put()
  @Roles(UserRole.DRIVER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async updateOwnUser(@Request() req, @Body() dto: UpdateUserDto) {
    const userId = req.user._id;
    const role = req.user.role;
    return this.usersService.updateUser(userId, dto, userId, role); // targetId = self
  }

  @Put(':id')
  @Roles(UserRole.SUPER_ADMIN)
  async updateAnyUser(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    const requestingUserId = req.user._id;
    const role = req.user.role;
    return this.usersService.updateUser(requestingUserId, dto, id, role);
  }

  @Post(':userId/assign-parking/:parkingSpaceId')
  @Roles(UserRole.SUPER_ADMIN)
  async assignParkingSpaceToUser(
    @Request() req,
    @Param('userId') userId: string,
    @Param('parkingSpaceId') parkingSpaceId: string,
  ) {
    const assignedByUserId = req.user._id;
    return this.usersService.assignParkingSpaceToAdmin(
      userId,
      parkingSpaceId,
      assignedByUserId,
    );
  }

  @Delete(':userId/unassign-parking/:parkingSpaceId')
  @Roles(UserRole.SUPER_ADMIN)
  async unassignParkingSpaceFromUser(
    @Param('userId') userId: string,
    @Param('parkingSpaceId') parkingSpaceId: string,
  ) {
    return this.usersService.unassignParkingSpaceFromAdmin(
      userId,
      parkingSpaceId,
    );
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Post()
  async createUser(@Request() req, @Body() dto: CreateUserDto) {
    const assignedByUserId = req.user._id;

    return this.usersService.createUser(assignedByUserId, dto);
  }
}
