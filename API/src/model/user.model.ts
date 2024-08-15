import { ApiProperty } from "@nestjs/swagger";

export class RegisterUserRequest {
    @ApiProperty()
    email: string;
    @ApiProperty()
    username: string;
    @ApiProperty()
    password: string;
}

export class UserResponse {
    @ApiProperty()
    email: string;
    @ApiProperty()
    username: string;
    @ApiProperty()
    token?: string;
}

export class LoginUserRequest {
    @ApiProperty()
    email: string;
    @ApiProperty()
    password: string;
}

export class UpdateUserRequest {
    @ApiProperty()
    username?: string;
    @ApiProperty()
    password?: string;
  }