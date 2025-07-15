import {
  Column,
  CreateDateColumn,
  Entity,
  ObjectId,
  ObjectIdColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../enums/roles.enum';
import { UserStatus } from '../enums/user-status.enum';

@Entity('users')
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column() first_name: string;
  @Column({ nullable: true }) middle_name?: string;
  @Column() last_name: string;
  @Column({ unique: true }) email: string;
  @Column() password: string;
  @Column() role: UserRole;
  @Column({ nullable: true }) phone_number?: string;
  @Column() failed_login_attempts: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  account_available_at: Date;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
  @Column() status: UserStatus;
}
