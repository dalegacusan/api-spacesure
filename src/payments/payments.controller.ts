// src/payments/payments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { UserRole } from 'src/libs/enums/roles.enum';
import { CreateManualPaymentDto } from './dto/create-manual-payment.request.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get(':referenceNumber')
  @Roles(UserRole.DRIVER)
  async getPaymentStatus(
    @Param('referenceNumber') referenceNumber: string,
    @Query('cancel') cancel: string,
  ) {
    return await this.paymentsService.checkAndUpdatePayment(
      referenceNumber,
      cancel === 'true',
    );
  }

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  async getAllPaymentsWithDetails() {
    return this.paymentsService.getAllWithReservations();
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async createManualPayment(@Body() dto: CreateManualPaymentDto) {
    return this.paymentsService.createManualPayment(dto);
  }
}
