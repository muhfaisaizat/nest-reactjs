import { HttpException, Inject, Injectable } from "@nestjs/common";
import { ValidationService } from "src/common/validation.service";
import { RegisterUserRequest, UserResponse } from "src/model/user.model";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from 'winston';
import { PrismaService } from "src/common/prisma.service";
import { UserValidation } from "./user.validation";
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
    constructor(
        private validationService: ValidationService,
        @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
        private prismaService: PrismaService,
    ){}

    async register(request: RegisterUserRequest) : Promise<UserResponse> {
        this.logger.info(`Register new user ${JSON.stringify(request)}`);
        const registerRequest : RegisterUserRequest = this.validationService.validate(
            UserValidation.REGISTER, 
            request,
        );

        const totalUserWithSameUsername = await this.prismaService.user.count({
            where: {
                username: registerRequest.username
            }
        })

        if(totalUserWithSameUsername != 0){
            throw new HttpException('Username Already Exist', 400);
        }

        registerRequest.password = await bcrypt.hash(registerRequest.password, 10);

        const user = await this.prismaService.user.create({
            data: registerRequest,
        });

        return {
            username: user.username,
            email: user.email,
        };
    }

}