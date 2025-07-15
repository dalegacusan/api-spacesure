import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateReservationDto {
  @IsMongoId()
  parking_space_id: string;

  @IsMongoId()
  vehicle_id: string;

  @IsDateString()
  start_time: string;

  @IsDateString()
  end_time: string;

  @IsString()
  reservation_type: string;

  @IsNumber()
  hourly_rate: number;

  @IsNumber()
  whole_day_rate: number;

  @IsNumber()
  total_price: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsString()
  discount_note?: string;
}
