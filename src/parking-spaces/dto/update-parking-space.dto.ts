import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AvailabilityStatus } from 'src/libs/enums/availability-status.enum';

export class UpdateParkingSpaceDto {
  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  establishment_name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  total_spaces?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  available_spaces?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  whole_day_rate?: number;

  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availability_status?: AvailabilityStatus;
}
