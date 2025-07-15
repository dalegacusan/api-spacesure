import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('reservations')
export class Reservation {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') user_id: ObjectId;
  @Column('objectId') parking_space_id: ObjectId;
  @Column('objectId') vehicle_id: ObjectId;
  @Column() start_time: Date;
  @Column() end_time: Date;
  @Column() reservation_type: string;
  @Column('decimal') hourly_rate: number;
  @Column('decimal') whole_day_rate: number;
  @Column('decimal', { default: 0 }) discount: number;
  @Column('decimal', { default: 0 }) tax: number;
  @Column('decimal') total_price: number;
  @Column({ nullable: true }) discount_note?: string;
  @Column({ default: 'pending' }) status: string;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
