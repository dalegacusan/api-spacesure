import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AvailabilityStatus } from '../enums/availability-status.enum';

@Entity('parking_spaces')
export class ParkingSpace {
  @ObjectIdColumn() _id: ObjectId;
  @Column() city: string;
  @Column() establishment_name: string;
  @Column() address: string;
  @Column() total_spaces: number;
  @Column() available_spaces: number;
  @Column('decimal') hourlyRate: number;
  @Column('decimal') whole_day_rate: number;
  @Column({ default: AvailabilityStatus.OPEN })
  availability_status: AvailabilityStatus;
  @Column({ default: false }) is_deleted: boolean;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
