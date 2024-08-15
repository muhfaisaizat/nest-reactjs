import { Delete, HttpException, Inject, Injectable } from "@nestjs/common";
import { ValidationService } from "src/common/validation.service";
import { LoginUserRequest, RegisterUserRequest, UpdateUserRequest, UserResponse } from "src/model/user.model";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
import { PrismaService } from "src/common/prisma.service";
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ){}

    async register(request: RegisterUserRequest) : Promise<UserResponse> {
        this.logger.debug(`Register new user ${JSON.stringify(request)}`);
        const registerRequest : RegisterUserRequest = this.validationService.validate(
            UserValidation.REGISTER, 
            request,
        );

        const totalUserWithSameEmail = await this.prismaService.user.count({
            where: {
                email: registerRequest.email
            }
        })

        if(totalUserWithSameEmail != 0){
            throw new HttpException('email Already Exist', 400);
        }

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: registerRequest,
        });

        return {
            email: user.email,
            username: user.username,
            
        };
    }

    async login(request: LoginUserRequest): Promise<UserResponse>{
        this.logger.debug(`UserService.login(${JSON.stringify(request)})`);
        const loginRequest: LoginUserRequest = this.validationService.validate(
            UserValidation.LOGIN,
            request,
        );
        let user = await this.prismaService.user.findUnique({
            where: {
                email: loginRequest.email
            }
        })

        if(!user){
            throw new HttpException('email dan password salah',401);
        };

        const isPasswordValid = await bcrypt.compare(
            loginRequest.password,
            user.password,
        );

        if(!isPasswordValid){
            throw new HttpException('email dan password salah',401);
        };

        user = await this.prismaService.user.update({
            where:{
                email: loginRequest.email
            },
            data:{
                token: uuid(),
            },
        });

        return {
            email: user.email,
            username: user.username,
            token: user.token,
          };
    }

    async get(user: User): Promise<UserResponse> {
        return {
          email: user.email,
          username: user.username,
          
        };
      }

      async update(user: User, request: UpdateUserRequest): Promise<UserResponse> {
        this.logger.debug(
          `UserService.update( ${JSON.stringify(user)} , ${JSON.stringify(request)} )`,
        );
    
        const updateRequest: UpdateUserRequest = this.validationService.validate(
          UserValidation.UPDATE,
          request,
        );
    
        if (updateRequest.username) {
          user.username = updateRequest.username;
        }
    
        if (updateRequest.password) {
          user.password = await bcrypt.hash(updateRequest.password, 10);
        }
    
        const result = await this.prismaService.user.update({
          where: {
            email: user.email,
          },
          data: user,
        });
    
        return {
          email: result.email,
          username: result.username,
        };
      }

      async logout(user: User): Promise<UserResponse> {
        const result = await this.prismaService.user.update({
          where: {
            email: user.email,
          },
          data: {
            token: null,
          },
        });
    
        return {
          email: result.email,
          username: result.username,
        };
      }



}