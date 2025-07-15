import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/libs/enums/roles.enum';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard-summary')
  @Roles(UserRole.SUPER_ADMIN)
  async getDashboardSummary() {
    return this.adminService.getDashboardSummary();
  }
}
