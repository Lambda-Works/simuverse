import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/User';
import { AppDataSource } from '../database/connection';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async getUserById(user_id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['simulations', 'assessments']
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { email }
    });

    return user || null;
  }

  async updateUser(user_id: string, updates: Partial<User>): Promise<User> {
    const user = await this.getUserById(user_id);

    // Don't allow direct password updates through this method
    if (updates.password) {
      delete updates.password;
    }

    Object.assign(user, updates);

    return await this.userRepository.save(user);
  }

  async listUsers(role?: UserRole): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');

    if (role) {
      query.where('user.role = :role', { role });
    }

    return await query.getMany();
  }

  async deleteUser(user_id: string): Promise<void> {
    await this.userRepository.delete({ id: user_id });
  }

  async getTeachers(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: UserRole.TEACHER }
    });
  }

  async getStudents(): Promise<User[]> {
    return await this.userRepository.find({
      where: { role: UserRole.STUDENT }
    });
  }
}
