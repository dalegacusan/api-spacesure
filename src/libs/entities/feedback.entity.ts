import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
} from 'typeorm';

@Entity('feedback')
export class Feedback {
  @ObjectIdColumn() _id: ObjectId;
  @Column('objectId') user_id: ObjectId;
  @Column('objectId') parking_space_id: ObjectId;
  @Column() rating: number;
  @Column({ nullable: true }) comment?: string;
  @CreateDateColumn() created_at: Date;
}
