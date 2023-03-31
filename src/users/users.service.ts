import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Users } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Users) private usersRepository: Repository<Users>,
  ) {}

  findAll(): Promise<Users[]> {
    return this.usersRepository.find();
  }

  findOne(email: string): Promise<Users | null> {
    return this.usersRepository.findOneBy({ email });
  }

  async createUser({
    email,
    userName,
    password,
  }: {
    email: string;
    userName: string;
    password: string;
  }) {
    const newUser = this.usersRepository.create({
      email,
      userName,
      password,
      refresh_token: '',
    });
    const user = await this.usersRepository.save(newUser);
    return user;
  }

  async updateRefreshToken(email: string, refresh_token: string) {
    const user = await this.findOne(email);
    if (!user) {
      throw new BadRequestException({ message: '이메일을 확인해주세요.' });
    }

    user.refresh_token = refresh_token;

    return await this.usersRepository.save(user);
  }
}
