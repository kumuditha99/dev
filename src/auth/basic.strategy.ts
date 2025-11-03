import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { BasicStrategy as Strategy } from 'passport-http';

@Injectable()
export class BasicAuthStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super();
  }

  validate(username: string, password: string): boolean {
    const validUser = process.env.BASIC_AUTH_USER;
    const validPass = process.env.BASIC_AUTH_PASS;

    if (username === validUser && password === validPass) {
      return true;
    }
    throw new UnauthorizedException('Invalid Basic Auth credentials');
  }
}
