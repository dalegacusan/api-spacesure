import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'mongodb';
import { CryptoService } from 'src/libs/crypto/crypto.service';
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
    private readonly cryptoService: CryptoService,
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

        const decryptedUser = user
          ? {
              _id: user._id,
              first_name: user.first_name
                ? this.cryptoService.decrypt(user.first_name)
                : null,
              last_name: user.last_name
                ? this.cryptoService.decrypt(user.last_name)
                : null,
              middle_name: user.middle_name
                ? this.cryptoService.decrypt(user.middle_name)
                : null,
              phone_number: user.phone_number
                ? this.cryptoService.decrypt(user.phone_number)
                : null,
              email: user.email,
            }
          : null;

        return {
          ...feedback,
          user: decryptedUser,
        };
      }),
    );

    return enrichedFeedbacks;
  }
}
