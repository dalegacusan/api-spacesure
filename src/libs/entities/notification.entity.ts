import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') user_id: ObjectId;
  @Column() notification_type: string;
  @Column() message: string;
  @Column({ default: () => 'new Date()' }) sent_date: Date;
  @Column({ default: 'unread' }) read_status: string;
}
