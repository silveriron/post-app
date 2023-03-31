import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token.access_token, {
        secret: 'thisIsSecretKey',
      });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      try {
        const payload = await this.jwtService.verifyAsync(token.refresh_token, {
          secret: 'thisIsSecretKey',
        });

        await this.authService.validateRefreshToken(
          payload.email,
          token.refresh_token,
        );

        const { access_token } = await this.authService.getAccessToken(payload);
        response.cookie('access_token', access_token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 30,
          sameSite: 'lax',
        });
      } catch {
        throw new UnauthorizedException();
      }
    }
    return true;
  }
  private extractTokenFromHeader(request: Request) {
    const access_token = request.cookies.access_token as string | undefined;
    const refresh_token = request.cookies.refresh_token as string | undefined;
    return { access_token, refresh_token };
  }
}
