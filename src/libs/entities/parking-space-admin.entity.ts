import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('parking_space_admins')
export class ParkingSpaceAdmin {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') parking_space_id: ObjectId;
  @Column('objectId') user_id: ObjectId;
  @Column('objectId') assigned_by_user_id: ObjectId;
  @Column({ default: () => 'new Date()' }) assigned_at: Date;
}
