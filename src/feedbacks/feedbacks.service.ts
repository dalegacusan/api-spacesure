import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { Feedback, User } from 'src/libs/entities';
import { Repository } from 'typeorm';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbacksService {
  constructor(
    @InjectRepository(Feedback)
    private readonly feedbackRepository: Repository<Feedback>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createFeedback(dto: CreateFeedbackDto): Promise<Feedback> {
    const feedback = this.feedbackRepository.create({
      ...dto,
      user_id: new ObjectId(dto.user_id),
      parking_space_id: new ObjectId(dto.parking_space_id),
    });
    return this.feedbackRepository.save(feedback);
  }

  async getFeedbacksByParkingSpace(parkingSpaceId: string): Promise<any[]> {
    const feedbacks = await this.feedbackRepository.find({
      where: {
        parking_space_id: new ObjectId(parkingSpaceId),
      },
      order: {
        created_at: 'DESC',
      },
    });

    const enrichedFeedbacks = await Promise.all(
      feedbacks.map(async (feedback) => {
        const user = await this.userRepository.findOne({
          where: { _id: feedback.user_id },
        });

        return {
          ...feedback,
          user,
        };
      }),
    );

    return enrichedFeedbacks;
  }
}
