import { ObjectId } from 'mongodb';
import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';

@Entity('reserved_slots')
@Index(['parking_space_id', 'date'], { unique: true })
export class ReservedSlot {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column('objectId')
  parking_space_id: ObjectId;

  @Column()
  date: string; // format: YYYY-MM-DD

  @Column({ default: 0 })
  reserved_count: number;
}
