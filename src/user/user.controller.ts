import { Body, Controller, Post } from "@nestjs/common";
import { UserService } from "./user.service";
import { RegisterUserRequest, UserResponse } from "src/model/user.model";
import { WebResponse } from "src/model/web.model";

@Controller('/api/users')
export class UserController {
    constructor(private userService: UserService) {}

    @Post()
    async register(
        @Body() request: RegisterUserRequest,
    ): Promise<WebResponse<UserResponse>> {
        const result = await this.userService.register(request);
        return {
            data: result,
        };
    }

}
