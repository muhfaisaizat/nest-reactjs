export class RegisterUserRequest {
    email: string;
    username: string;
    password: string;
}

export class UserResponse {
    email: string;
    username: string;
    token?: string;
}

export class LoginUserRequest {
    email: string;
    password: string;
}

export class UpdateUserRequest {
    username?: string;
    password?: string;
  }