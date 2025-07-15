import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') user_id: ObjectId;
  @Column() vehicle_type: string;
  @Column() year_make_model: string;
  @Column() color: string;
  @Column({ unique: true }) plate_number: string;
  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}
