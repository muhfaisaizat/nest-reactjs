// import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
// import { ValidationService } from 'src/common/validation.service';
// import {
//   LoginUserRequest,
//   RegisterUserRequest,
//   UpdateUserRequest,
//   UserResponse,
//   UpdateUser,
//   CreateUser,
//   CreateProject,
//   CreateProjectTalent,
//   UpdateProject,
//   CreateCheckpointAttachment,
//   CreateCheckpoint,
//   UpdateCheckpoint,
//   CreateInvoice,
//   Items_Invoice,
//   UpdateCheckpointAttachment,
//   UpdateInvoice
// } from 'src/model/user.model';
// import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
// import { Logger } from 'winston';
// import { PrismaService } from 'src/common/prisma.service';
// import { UserValidation } from './user.validation';
// import * as bcrypt from 'bcrypt';
// import { JwtService } from '@nestjs/jwt';
// import { CustomMailerService } from '../mailer/mailer.service';
// import { string, ZodError } from 'zod';
// import { User, Project, Project_Talent, Project_Checkpoint, Project_Checkpoint_Attachment, Invoice, Invoice_ItemList } from '@prisma/client';
// import dayjs from 'dayjs';
// import utc from 'dayjs/plugin/utc';
// import timezone from 'dayjs/plugin/timezone';
// import { Prisma } from '@prisma/client';

// dayjs.extend(utc);
// dayjs.extend(timezone);

// function getAdjustedDate(): Date {
//   // Get current date and time
//   const currentDate = new Date();

//   // Calculate timezone offset in milliseconds (Asia/Jakarta is UTC+7)
//   const timezoneOffsetMillis = 7 * 60 * 60 * 1000; // 7 hours in milliseconds

//   // Adjust current date to Asia/Jakarta timezone
//   const adjustedDate = new Date(currentDate.getTime() + timezoneOffsetMillis);

//   return adjustedDate;
// }

// @Injectable()
// export class UserService {
//   constructor(
//     private validationService: ValidationService,
//     @Inject(WINSTON_MODULE_PROVIDER) private logger: Logger,
//     private prismaService: PrismaService,
//     private jwtService: JwtService,
//     private customMailerService: CustomMailerService,
//   ) {}

//   async register(request: RegisterUserRequest): Promise<UserResponse> {
//     this.logger.debug(`Mendaftarkan pengguna baru: ${JSON.stringify(request)}`);

//     // Validasi input pengguna
//     const registerRequest: RegisterUserRequest =
//       this.validationService.validate(UserValidation.REGISTER, request);

//     // Cek apakah email sudah terdaftar
//     const existingUser = await this.prismaService.user.findUnique({
//       where: { Email: registerRequest.email },
//     });

//     if (existingUser) {
//       throw new HttpException('Email sudah terdaftar', HttpStatus.BAD_REQUEST);
//     }

//     // Hash password pengguna
//     const hashedPassword = await bcrypt.hash(registerRequest.password, 10);

//     // Buat pengguna baru dengan data yang diperlukan
//     const user = await this.prismaService.user.create({
//       data: {
//         Username: registerRequest.username,
//         Email: registerRequest.email,
//         Password: hashedPassword,
//         Created_at: getAdjustedDate(), // Diisi otomatis waktu sekarang saat dibuat
//         Updated_at: getAdjustedDate(), // Diisi otomatis waktu sekarang saat data dimasukkan
//       },
//     });

//     // Return data pengguna yang telah terdaftar
//     return {
//       email: user.Email,
//       username: user.Username,
//       mobile_number: user.Mobile_number,
//       position: user.Position,
//       role: user.Role,
//       picture: user.Picture,
//       status: user.Status,
//     };
//   }

//   async login(request: LoginUserRequest): Promise<UserResponse> {
//     // Validasi request
//     const loginRequest: LoginUserRequest = this.validationService.validate(
//       UserValidation.LOGIN,
//       request,
//     );

//     // Temukan pengguna berdasarkan email
//     const user = await this.prismaService.user.findUnique({
//       where: { Email: loginRequest.email },
//     });

//     if (!user) {
//       this.logger.error('User not found');
//       throw new HttpException(
//         'Email atau password salah',
//         HttpStatus.UNAUTHORIZED,
//       );
//     }

//     // Periksa kecocokan password
//     const passwordMatch = await bcrypt.compare(
//       loginRequest.password,
//       user.Password,
//     );
//     if (!passwordMatch) {
//       this.logger.error('Password mismatch');
//       throw new HttpException(
//         'Email atau password salah',
//         HttpStatus.UNAUTHORIZED,
//       );
//     }

//     // Buat payload dan token JWT
//     const payload = {
//       email: user.Email,
//       username: user.Username,
//       role: user.Role,
//     };
//     const token = this.jwtService.sign(payload);

//     // Perbarui token di database
//     await this.prismaService.user.update({
//       where: { Email: user.Email },
//       data: { Token: token },
//     });

//     this.logger.debug(`User logged in successfully. Token: ${token}`);

//     return {
//       email: user.Email,
//       username: user.Username,
//       mobile_number: user.Mobile_number,
//       position: user.Position,
//       role: user.Role,
//       picture: user.Picture,
//       status: user.Status,
//       token,
//     };
//   }

//   async forgotPassword(email: string): Promise<void> {
//     const user = await this.prismaService.user.findUnique({
//       where: { Email: email },
//     });

//     if (!user) {
//       throw new HttpException('User not found', HttpStatus.NOT_FOUND);
//     }

//     // Generate a 6-digit numeric token
//     const token = Math.floor(100000 + Math.random() * 900000).toString();

//     // Gunakan getAdjustedDate untuk mendapatkan waktu kadaluarsa token
//     const expires = getAdjustedDate();
//     expires.setHours(expires.getHours() + 1); // Token berlaku selama 1 jam

//     // Simpan token ke database
//     await this.prismaService.user.update({
//       where: { Email: email },
//       data: {
//         ResetPasswordToken: token,
//         ResetTokenExpires: expires,
//       },
//     });

//     // Kirim email dengan token
//     await this.customMailerService.sendResetPasswordEmail(email, token);
//   }

//   async resetPassword(token: string, newPassword: string): Promise<void> {
//     // Validasi input
//     try {
//       UserValidation.RESET_PASSWORD.parse({
//         token,
//         newPassword,
//       });
//     } catch (error) {
//       if (error instanceof ZodError) {
//         throw new HttpException(error.errors, HttpStatus.BAD_REQUEST);
//       }
//       throw error;
//     }

//     // Gunakan getAdjustedDate untuk mendapatkan waktu saat ini
//     const now = getAdjustedDate();

//     // Cari pengguna dengan token reset yang valid
//     const user = await this.prismaService.user.findFirst({
//       where: {
//         ResetPasswordToken: token,
//         ResetTokenExpires: {
//           gte: now, // Gunakan now untuk perbandingan
//         },
//       },
//     });

//     if (!user) {
//       throw new HttpException(
//         'Token tidak valid atau sudah kadaluarsa',
//         HttpStatus.BAD_REQUEST,
//       );
//     }

//     // Hash password baru
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     // Perbarui password dan hapus token reset
//     await this.prismaService.user.update({
//       where: { Email: user.Email },
//       data: {
//         Password: hashedPassword,
//         ResetPasswordToken: null,
//         ResetTokenExpires: null,
//         Updated_at: getAdjustedDate(),
//       },
//     });
//   }

//   async logout(user: User): Promise<UserResponse> {
//     const result = await this.prismaService.user.update({
//       where: { Email: user.Email },
//       data: { Token: null },
//     });

//     return {
//       email: user.Email,
//       username: user.Username,
//       mobile_number: user.Mobile_number,
//       position: user.Position,
//       role: user.Role,
//       picture: user.Picture,
//       status: user.Status,
//     };
//   }
// }

// @Injectable()
// export class AdminService {
//   constructor(private readonly prisma: PrismaService) {}

  // async findAllUsersByRole(role?: string): Promise<User[]> {
  //   // Jika role adalah 'All Roles', tidak memfilter berdasarkan role
  //   const whereClause =
  //     role && role !== 'All Roles'
  //       ? { Role: role, Deleted_at: null }
  //       : { Deleted_at: null };

  //   // Menjalankan query dengan whereClause yang sudah dibangun
  //   return this.prisma.user.findMany({
  //     where: whereClause,
  //   });
  // }

  // async findUserById(id: number) {
  //   return this.prisma.user.findUnique({ where: { ID_user: id } });
  // }

  // async updateUserById(id: number, data: UpdateUser): Promise<User> {
  //   // Prepare the updated data
  //   const updatedData: Partial<User> = {};

  //   if (data.email) {
  //     updatedData.Email = data.email;
  //   }

  //   if (data.password) {
  //     updatedData.Password = await bcrypt.hash(data.password, 10);
  //   }

  //   if (data.username) {
  //     updatedData.Username = data.username;
  //   }

  //   if (data.mobile_number) {
  //     updatedData.Mobile_number = data.mobile_number;
  //   }

  //   if (data.position) {
  //     updatedData.Position = data.position;
  //   }

  //   if (data.role) {
  //     updatedData.Role = data.role;
  //   }

  //   if (data.picture) {
  //     updatedData.Picture = data.picture;
  //   }

  //   if (data.status) {
  //     updatedData.Status = data.status;
  //   }

  //   updatedData.Updated_at = getAdjustedDate();

  //   return this.prisma.user.update({
  //     where: { ID_user: id },
  //     data: updatedData,
  //   });
  // }

  // async deleteUserById(id: number) {
  //   return this.prisma.user.delete({ where: { ID_user: id } });
  // }

  // async createUser(createUserDto: CreateUser): Promise<User> {
  //   // Check if email already exists
  //   const existingUser = await this.prisma.user.findUnique({
  //     where: { Email: createUserDto.email },
  //   });

  //   if (existingUser) {
  //     throw new HttpException('Email already in use', HttpStatus.BAD_REQUEST);
  //   }

  //   // Hash the password
  //   const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

  //   // Create a new user
  //   const newUser = await this.prisma.user.create({
  //     data: {
  //       Username: createUserDto.username,
  //       Email: createUserDto.email,
  //       Password: hashedPassword,
  //       Mobile_number: createUserDto.mobile_number,
  //       Position: createUserDto.position,
  //       Role: createUserDto.role || 'customer', // Default to 'customer'
  //       Picture: createUserDto.picture,
  //       Status: createUserDto.status || 'active', // Default to 'active'
  //       Created_at: getAdjustedDate(), // Set creation date
  //       Updated_at: getAdjustedDate(), // Set updated date
  //     },
  //   });

  //   return newUser;
  // }

  // async softDeleteUserById(id: number) {
  //   const user = await this.prisma.user.findUnique({
  //     where: { ID_user: id },
  //   });

  //   if (!user) {
  //     throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //   }

  //   try {
  //     return await this.prisma.user.update({
  //       where: { ID_user: id },
  //       data: {
  //         Username: '-',
  //         Email: '-',
  //         Password: '-',
  //         Mobile_number: '-',
  //         Position: null,
  //         Picture: '-',
  //         Token: '-',
  //         Status: 'inactive',
  //         Deleted_at: getAdjustedDate(),
  //       },
  //     });
  //   } catch (error) {
  //     throw new HttpException(
  //       'Failed to soft delete user',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  // async ReadAllTalent(): Promise<User[]> {
  //   return this.prisma.user.findMany({
  //     where: {
  //       Role: 'talent',
  //       Deleted_at: null,
  //     },
  //   });
  // }

  // async createProject(createProjectDto: CreateProject): Promise<Project> {
  //   // Periksa apakah proyek dengan judul yang sama sudah ada
  //   const existingProject = await this.prisma.project.findFirst({
  //     where: { Project_title: createProjectDto.project_title },
  //   });

  //   if (existingProject) {
  //     throw new HttpException(
  //       'Project title already in use',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }

  //   // Buat proyek baru
  //   const newProject = await this.prisma.project.create({
  //     data: {
  //       Project_title: createProjectDto.project_title,
  //       Platform: createProjectDto.platform,
  //       Deadline: new Date(createProjectDto.deadline), // Konversi string ke Date
  //       Status: createProjectDto.status,
  //       Image: createProjectDto.image,
  //       user: { connect: { ID_user: createProjectDto.userId } },
  //       Created_at: getAdjustedDate(), // Set creation date
  //       Updated_at: getAdjustedDate(), // Set updated date
  //     },
  //   });

  //   return newProject;
  // }

  // async createProjectTalent(
  //   createProjectTalent: CreateProjectTalent,
  // ): Promise<Project_Talent> {
  //   const { ID_project, ID_user } = createProjectTalent;

  //   return this.prisma.project_Talent.create({
  //     data: {
  //       ID_project,
  //       ID_user,
  //     },
  //   });
  // }

  // async findAllProjects() {
  //   return this.prisma.project.findMany({
  //     where: {
  //       Deleted_at: null,
  //     },
  //   });
  // }

  // async findProjectById(id: number) {
  //   return this.prisma.project.findUnique({
  //     where: { ID_project: id },
  //     select: {
  //       ID_project: true,
  //       ID_user: true,
  //       user: {
  //         select: {
  //           Username: true,
  //           Picture: true,
  //         },
  //       },
  //       Image: true,
  //       Project_title: true,
  //       Platform: true,
  //       Deadline: true,
  //       Status: true,
  //     },
  //   });
  // }

  // async updateProjectById(id: number, data: UpdateProject): Promise<Project> {
  //   // Prepare the updated data
  //   const updatedData: Partial<Project> = {};

  //   if (data.ID_user !== undefined) {
  //     updatedData.ID_user = data.ID_user;
  //   }

  //   if (data.Image) {
  //     updatedData.Image = data.Image;
  //   }

  //   if (data.Project_title) {
  //     updatedData.Project_title = data.Project_title;
  //   }

  //   if (data.Platform) {
  //     updatedData.Platform = data.Platform;
  //   }

  //   if (data.Deadline) {
  //     updatedData.Deadline = new Date(data.Deadline);
  //   }

  //   if (data.Status) {
  //     updatedData.Status = data.Status;
  //   }

  //   updatedData.Updated_at = getAdjustedDate(); // Use your function to set the current date and time

  //   return this.prisma.project.update({
  //     where: { ID_project: id },
  //     data: updatedData,
  //   });
  // }

  // async softDeleteProjectById(id: number) {
  //   const user = await this.prisma.project.findUnique({
  //     where: { ID_project: id },
  //   });

  //   if (!user) {
  //     throw new HttpException('User not found', HttpStatus.NOT_FOUND);
  //   }

  //   try {
  //     return await this.prisma.project.update({
  //       where: { ID_project: id },
  //       data: {
  //         Deleted_at: getAdjustedDate(),
  //       },
  //     });
  //   } catch (error) {
  //     throw new HttpException(
  //       'Failed to soft delete user',
  //       HttpStatus.BAD_REQUEST,
  //     );
  //   }
  // }

  // async findProjectTalentByProjectId(projectId: number) {
  //   // Fetch Project_Talent records where the ID_project matches
  //   const projectTalents = await this.prisma.project_Talent.findMany({
  //     where: { ID_project: projectId, Deleted_at: null },
  //     include: {
  //       user: true, // Include the related User data
  //     },
  //   });

  //   if (projectTalents.length === 0) {
  //     throw new Error(
  //       'No ProjectTalent records found for the given Project ID',
  //     );
  //   }

  //   // Map and customize the response
  //   return projectTalents.map((pt) => ({
  //     ID_talent: pt.ID_talent,
  //     ID_project: pt.ID_project,
  //     ID_user: pt.ID_user,
  //     user: {
  //       Username: pt.user.Username,
  //       Picture: pt.user.Picture,
  //       Position: pt.user.Position,
  //       Role: pt.user.Role,
  //     },
  //   }));
  // }

  // async softDeleteProjectTalentById(id: number) {
  //   // Find the Project_Talent record by ID
  //   const projectTalent = await this.prisma.project_Talent.findUnique({
  //     where: { ID_talent: id },
  //   });

  //   // Check if the record exists
  //   if (!projectTalent) {
  //     throw new Error('ProjectTalent not found');
  //   }

  //   // Update the record to set Deleted_at field to the current date and time
  //   return this.prisma.project_Talent.update({
  //     where: { ID_talent: id },
  //     data: {
  //       Deleted_at: new Date(), // Set Deleted_at to the current date and time
  //     },
  //   });
  // }

  // async countProjectStatuses() {
  //   const statuses = ['Rejected', 'In Progress', 'On Going', 'Done'];

  //   const counts = await Promise.all(
  //     statuses.map(async (status) => {
  //       const count = await this.prisma.project.count({
  //         where: {
  //           Status: status.trim(), // Trim to handle any extra spaces
  //           Deleted_at: null, // Ensure deleted_at is null
  //         },
  //       });
  //       console.log(`Status: ${status}, Count: ${count}`);
  //       return { status, count };
  //     }),
  //   );

  //   return counts;
  // }

//   async createCheckpoint(createCheckpointDto: CreateCheckpoint): Promise<Project_Checkpoint> {
    
//     // Buat proyek baru
//     const newCheckpoint = await this.prisma.project_Checkpoint.create({
//       data: {
//         Checkpoint_title: createCheckpointDto.checkpoint_title,
//         Description: createCheckpointDto.description,
//         project: { connect: { ID_project: createCheckpointDto.projectId } }, 
//         Created_at: getAdjustedDate(),  // Set creation date
//         Updated_at: getAdjustedDate(),  // Set updated date
//       },
//     });
  
//     return newCheckpoint;
//   }

//   async findCheckpointById(id: number) {
//     return this.prisma.project_Checkpoint.findMany({
//       where: { ID_project: id },
//       select: {
//         ID_checkpoint: true,
//         Checkpoint_title: true,
//         Description: true,
//         project: {
//           select: {
//             ID_project: true,
//             Project_title: true,
//           },
//         },
//       },
//     });
//   }

//   async updateCheckpointById(id: number, data: UpdateCheckpoint): Promise<Project_Checkpoint> {
//     // Prepare the updated data
//     const updatedData: Partial<Project_Checkpoint> = {};
  
//     if (data.ID_project !== undefined) {
//       updatedData.ID_project = data.ID_project;
//     }
  
//     if (data.Checkpoint_title) {
//       updatedData.Checkpoint_title = data.Checkpoint_title;
//     }
  
//     if (data.Description) {
//       updatedData.Description = data.Description;
//     }
  
//     updatedData.Updated_at = getAdjustedDate(); // Gunakan fungsi Anda untuk mengatur waktu saat ini
  
//     return this.prisma.project_Checkpoint.update({
//       where: { ID_checkpoint: id },
//       data: updatedData,
//     });
//   }

// async softDeleteCheckpointById(id: number) {
//   const checkpoint = await this.prisma.project_Checkpoint.findUnique({
//     where: { ID_checkpoint: id },
//   });

//   if (!checkpoint) {
//     throw new HttpException('Checkpoint not found', HttpStatus.NOT_FOUND);
//   }

//   try {
//     return await this.prisma.project_Checkpoint.update({
//       where: { ID_checkpoint: id },
//       data: {
//         Deleted_at: getAdjustedDate(),
//       },
//     });
//   } catch (error) {
//     throw new HttpException(
//       'Failed to soft delete checkpoint',
//       HttpStatus.BAD_REQUEST,
//     );
//   }
// }
  
//   async createCheckpointAttachment(createCheckpointAttachment: CreateCheckpointAttachment): Promise<Project_Checkpoint_Attachment> {
//     const { ID_checkpoint } = createCheckpointAttachment;

//     return this.prisma.project_Checkpoint_Attachment.create({
//       data: {
//         Url: createCheckpointAttachment.url,
//         ID_checkpoint,
//       },
//     });
//   }

//   async updateCheckpointAttachmentById(
//     id: number,
//     updateCheckpointAttachment: UpdateCheckpointAttachment,
//   ): Promise<Project_Checkpoint_Attachment> {
//     const { ID_checkpoint, url } = updateCheckpointAttachment;
  
//     // Prepare the updated data object
//     const updatedData: Partial<Project_Checkpoint_Attachment> = {};
  
//     if (ID_checkpoint !== undefined) {
//       updatedData.ID_checkpoint = ID_checkpoint;
//     }
  
//     if (url !== undefined) {
//       updatedData.Url = url;
//     }
  
//     updatedData.Updated_at = new Date(); // Set updated timestamp
  
//     // Update the checkpoint attachment in the database
//     return this.prisma.project_Checkpoint_Attachment.update({
//       where: { ID_attachment: id },
//       data: updatedData,
//     });
//   }
  

//   async findCheckpointAttachmentsById(checkpointId: number) {
//     // Fetch Project_Checkpoint_Attachment records where the ID_checkpoint matches
//     const checkpointAttachments = await this.prisma.project_Checkpoint_Attachment.findMany({
//       where: { ID_checkpoint: checkpointId, Deleted_at: null },
//     });
  
//     if (checkpointAttachments.length === 0) {
//       throw new Error(
//         'No CheckpointAttachment records found for the given Checkpoint ID',
//       );
//     }
  
//     // Map and customize the response
//     return checkpointAttachments.map((attachment) => ({
//       ID_attachment: attachment.ID_attachment,
//       ID_checkpoint: attachment.ID_checkpoint,
//       Url: attachment.Url,
//       Created_at: attachment.Created_at,
//       Updated_at: attachment.Updated_at,
//     }));
//   }
  
//   async softDeleteCheckpointAttachmentById(id: number) {
//     // Find the Project_Checkpoint_Attachment record by ID
//     const checkpointAttachment = await this.prisma.project_Checkpoint_Attachment.findUnique({
//       where: { ID_attachment: id },
//     });
  
//     // Check if the record exists
//     if (!checkpointAttachment) {
//       throw new Error('CheckpointAttachment not found');
//     }
  
//     // Update the record to set Deleted_at field to the current date and time
//     return this.prisma.project_Checkpoint_Attachment.update({
//       where: { ID_attachment: id },
//       data: {
//         Deleted_at: new Date(), // Set Deleted_at to the current date and time
//       },
//     });
//   }  

  // async readProjectDashboard(status?: string) {
  //   // Menambahkan filter status secara dinamis jika status disediakan, kecuali untuk "All"
  //   const query = `
  //     SELECT 
  //       project.ID_project, 
  //       project.Project_title, 
  //       project.Status, 
  //       project.Platform, 
  //       GROUP_CONCAT(user.Picture) AS Talent_Pictures, 
  //       project_checkpoint.Updated_at, 
  //       project.Deadline
  //     FROM Project project
  //     JOIN Project_Talent project_talent ON project.ID_project = project_talent.ID_project
  //     JOIN User user ON project_talent.ID_user = user.ID_user
  //     LEFT JOIN Project_Checkpoint project_checkpoint ON project.ID_project = project_checkpoint.ID_project
  //     WHERE user.Role = 'talent'
  //     ${status && status !== 'All' ? 'AND project.Status = ?' : ''}
  //     GROUP BY 
  //       project.ID_project, 
  //       project.Project_title, 
  //       project.Status, 
  //       project.Platform, 
  //       project_checkpoint.Updated_at, 
  //       project.Deadline;
  //   `;
  
  //   // Jika status adalah "All", kembalikan semua proyek tanpa filter status
  //   return status && status !== 'All'
  //     ? this.prisma.$queryRawUnsafe(query, status)
  //     : this.prisma.$queryRawUnsafe(query);
  // }

  // async readProjectDashboardDropdown(id?: number){
  //   const query = `
  //     SELECT 
  //       project.ID_project, 
  //       project_checkpoint.ID_checkpoint,
  //       project.Image, 
  //       project_checkpoint.Checkpoint_title, 
  //       project_checkpoint.Description, 
  //       GROUP_CONCAT(project_checkpoint_attachment.Url SEPARATOR ', ') AS Attachment_Urls
  //     FROM Project project
  //     JOIN Project_Checkpoint project_checkpoint 
  //       ON project.ID_project = project_checkpoint.ID_project
  //     LEFT JOIN Project_Checkpoint_Attachment project_checkpoint_attachment 
  //       ON project_checkpoint.ID_checkpoint = project_checkpoint_attachment.ID_checkpoint
  //     JOIN (
  //       SELECT 
  //         ID_project, 
  //         MAX(ID_checkpoint) AS Max_ID_checkpoint
  //       FROM Project_Checkpoint
  //       GROUP BY ID_project
  //     ) AS max_checkpoints
  //       ON project_checkpoint.ID_checkpoint = max_checkpoints.Max_ID_checkpoint
  //       AND project_checkpoint.ID_project = max_checkpoints.ID_project
  //     WHERE project.ID_project = ${id}  -- Replace with parameterized query if needed
  //     GROUP BY 
  //       project.ID_project,
  //       project_checkpoint.ID_checkpoint,
  //       project.Image, 
  //       project_checkpoint.Checkpoint_title, 
  //       project_checkpoint.Description
  //   `;

  //   return this.prisma.$queryRawUnsafe(query);
  // }

//   async createInvoice(createInvoice: CreateInvoice): Promise<Invoice> {
//     const { ID_project, Payment_Due, Payment_Type, Total_Termin, Termin_Number, Notes, Status } = createInvoice;
  
//     try {
//       // Menghitung jumlah invoice yang sudah ada
//       const invoiceCount = await this.prisma.invoice.count();
//       // Format ID_Invoice dengan padding
//       const newID = `INV-${String(invoiceCount + 1).padStart(6, '0')}`;
  
//       const newInvoice = await this.prisma.invoice.create({
//         data: {
//           ID_Invoice: newID,  // Menggunakan ID yang sudah diformat
//           ID_project,
//           Payment_Due,
//           Payment_Type,
//           Total_Termin,
//           Termin_Number,
//           Notes,
//           Created_at: new Date(),  // Menggunakan waktu saat ini
//           Updated_at: new Date(),  // Menggunakan waktu saat ini
//           Status,
//         },
//       });
  
//       return newInvoice;
//     } catch (error) {
//       console.error('Error creating invoice:', error);
//       throw new HttpException(
//         'Failed to create invoice',
//         HttpStatus.BAD_REQUEST,
//       );
//     }
//   }
  
//   async updateInvoiceById(id: string, updateInvoiceDto: UpdateInvoice): Promise<Invoice> {
//     const updatedData: Partial<Invoice> = {};
  
//     // Hanya memperbarui field yang disediakan
//     if (updateInvoiceDto.Payment_Due) {
//       updatedData.Payment_Due = updateInvoiceDto.Payment_Due;
//     }
  
//     if (updateInvoiceDto.Payment_Type) {
//       updatedData.Payment_Type = updateInvoiceDto.Payment_Type;
//     }
  
//     if (updateInvoiceDto.Total_Termin !== undefined) {
//       updatedData.Total_Termin = updateInvoiceDto.Total_Termin;
//     }
  
//     if (updateInvoiceDto.Termin_Number !== undefined) {
//       updatedData.Termin_Number = updateInvoiceDto.Termin_Number;
//     }
  
//     if (updateInvoiceDto.Notes) {
//       updatedData.Notes = updateInvoiceDto.Notes;
//     }
  
//     if (updateInvoiceDto.Status) {
//       updatedData.Status = updateInvoiceDto.Status;
//     }
  
//     updatedData.Updated_at = new Date(); // Menyesuaikan waktu diperbarui
  
//     // Melakukan update di database
//     return this.prisma.invoice.update({
//       where: { ID_Invoice: id },
//       data: updatedData,
//     });
//   }
  
//   async softDeleteInvoiceById(id: string): Promise<Invoice> {
//     // Cek apakah invoice ada
//     const invoice = await this.prisma.invoice.findUnique({
//       where: { ID_Invoice: id },
//     });
  
//     if (!invoice) {
//       throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
//     }
  
//     // Melakukan soft delete dengan memperbarui field Deleted_at
//     return this.prisma.invoice.update({
//       where: { ID_Invoice: id },
//       data: {
//         Deleted_at: new Date(), // Set Deleted_at ke waktu saat ini
//       },
//     });
//   }  

// async createItemsInvoice(createItemsInvoice: Items_Invoice): Promise<Invoice_ItemList> {
//     const { ID_Invoice, Tittle, Description, Quantity, Price } = createItemsInvoice;

//     return this.prisma.invoice_ItemList.create({
//       data: {
//         ID_Invoice,
//         Tittle,
//         Description,
//         Quantity,
//         Price,
//         Created_at: getAdjustedDate(),  // Set creation date
//         Updated_at: getAdjustedDate(),  // Set updated date
//       },
//     });
// }


// async getInvoicesSummary(status: 'All' | 'Draft' | 'Paid' | 'Sent' | 'OnHold') {
//   // Kondisi untuk filter status
//   const statusQuery = status === 'All' ? Prisma.sql`` : Prisma.sql`AND invoice.Status = ${status}`;
  
//   // Membuat query SQL dinamis
//   const query = Prisma.sql`
//     SELECT 
//       invoice.ID_Invoice, 
//       invoice.Status, 
//       user.Username,
//       SUM(invoice_itemlist.Price * invoice_itemlist.Quantity) AS Amount,
//       DATE(invoice.Created_at) AS Created_at, 
//       DATE(invoice.Payment_Due) AS Payment_Due 
//     FROM 
//       Invoice invoice
//     JOIN 
//       Project project ON invoice.ID_project = project.ID_project
//     JOIN 
//       User user ON project.ID_user = user.ID_user
//     JOIN 
//       Invoice_ItemList invoice_itemlist ON invoice.ID_Invoice = invoice_itemlist.ID_Invoice
//     WHERE
//       1=1
//       ${statusQuery}
//     GROUP BY 
//       invoice.ID_Invoice, 
//       invoice.Status, 
//       user.Username,
//       DATE(invoice.Created_at),
//       DATE(invoice.Payment_Due);
//   `;

//   return this.prisma.$queryRaw(query);
// }



// async findInvoiceById(id: string) {
//   return this.prisma.invoice.findUnique({
//     where: { ID_Invoice: id },
//     select: {
//       Status: true,
//       ID_Invoice: true,
//       Payment_Due: true,
//       Payment_Type: true,
//       Total_Termin: true,
//       Termin_Number: true,
//       ID_project: true,
//       Notes: true,
//       items: {  // Mengambil invoice_itemlist yang terkait
//         select: {
//           ID_ItemList :true,
//           Tittle : true,
//           Description: true,
//           Quantity: true,
//           Price: true,
//         },
//       },
//     },
//   });
// }

  
  
// }