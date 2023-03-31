import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Users } from 'src/users/users.entity';
import { UsersService } from 'src/users/users.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const bcrypt = require('bcrypt');

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async signup({ email, userName, password }: CreateUserDto) {
    const duplicateUser = await this.usersService.findOne(email);

    if (duplicateUser) {
      throw new BadRequestException({ message: '이미 가입된 이메일 입니다.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);

    const user = await this.usersService.createUser({
      email,
      userName,
      password: hashedPassword,
    });

    const tokens = await this.updateToken(user);

    return tokens;
  }

  async signin({ email, password }: LoginUserDto) {
    const user = await this.usersService.findOne(email);

    if (!user) {
      throw new BadRequestException({ message: '가입되지 않은 이메일입니다.' });
    }

    const comparePassword = bcrypt.compareSync(password, user.password);

    if (!comparePassword) {
      throw new BadRequestException({ message: '패스워드를 확인해주세요.' });
    }

    const tokens = await this.updateToken(user);

    return tokens;
  }

  async updateToken(user: Users) {
    const payload = { userName: user.userName, email: user.email, id: user.id };

    const refresh_token = await this.jwtService.signAsync(payload, {
      expiresIn: '7 days',
    });

    await this.usersService.updateRefreshToken(user.email, refresh_token);

    return {
      access_token: await this.jwtService.signAsync(payload),
      refresh_token,
    };
  }

  async validateRefreshToken(email, refresh_token: string) {
    const user = await this.usersService.findOne(email);

    if (!(refresh_token === user.refresh_token)) {
      console.log(refresh_token, user.refresh_token);
      throw new UnauthorizedException();
    }

    return true;
  }

  async getAccessToken(user: Users) {
    const payload = { userName: user.userName, email: user.email, id: user.id };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
