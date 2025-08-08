// src/payments/dto/create-manual-payment.dto.ts
import {
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentStatus } from 'src/libs/enums/payment-status.enum';

export class CreateManualPaymentDto {
  @IsMongoId()
  reservation_id: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  payment_method: string;

  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @IsString()
  @IsOptional()
  receipt_number?: string;

  @IsString()
  @IsOptional()
  reference_number?: string;
}
