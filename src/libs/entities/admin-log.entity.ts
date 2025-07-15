import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('admin_logs')
export class AdminLog {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') admin_user_id: ObjectId;
  @Column() action_type: string;
  @Column() action_description: string;
  @Column({ default: () => 'new Date()' }) timestamp: Date;
}
