import { Body, Controller, Delete, Get, HttpCode, Patch, Post, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { LoginUserRequest, RegisterUserRequest, UpdateUserRequest, UserResponse } from 'src/model/user.model';
import { WebResponse } from 'src/model/web.model';
import { Auth } from 'src/common/auth.decorator';
import { User } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';


@ApiTags('/api')
@Controller('/api/')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/Register')
  @HttpCode(200)
  async register(
    @Body() request: RegisterUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.register(request);
    return {
      data: result,
    };
  }

  @Post('/login')
  @HttpCode(200)
  async login(
    @Body() request: LoginUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.login(request);
    return {
      data: result,
    };
  }

  @Get('/User')
  @HttpCode(200)
  @ApiBearerAuth() // Untuk dokumentasi Swagger
  async get(@Auth() user: User): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.get(user);
    return {
      data: result,
    };
  }

  @Patch('/forget-password')
  @HttpCode(200)
  @ApiBearerAuth() // Untuk dokumentasi Swagger
  async update(
    @Auth() user: User,
    @Body() request: UpdateUserRequest,
  ): Promise<WebResponse<UserResponse>> {
    const result = await this.userService.update(user, request);
    return {
      data: result,
    };
  }

  @Delete('/logout')
  @HttpCode(200)
  @ApiBearerAuth() // Untuk dokumentasi Swagger
  async logout(@Auth() user: User): Promise<WebResponse<boolean>> {
    await this.userService.logout(user);
    return {
      data: true,
    };
  }
}
