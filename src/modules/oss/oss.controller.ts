import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBearerAuth,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';
import { OssService } from './oss.service';
import { UploadResult } from './oss.interface';

@ApiTags('文件上传')
@ApiBearerAuth()
@Controller('upload')
export class OssController {
  constructor(private readonly ossService: OssService) {}

  /**
   * 单文件上传
   */
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
      fileFilter: (req, file, callback) => {
        // 只允许图片类型
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('只允许上传图片文件'),
            false
          );
        }
        callback(null, true);
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传单张图片', description: '上传单张图片到 OSS' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '图片文件' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body('prefix') prefix?: string
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('请选择要上传的图片');
    }

    return this.ossService.uploadFile(file, { prefix: prefix || 'images' });
  }

  /**
   * 多文件上传
   */
  @Post('images')
  @UseInterceptors(
    FilesInterceptor('files', 9, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 每个文件最大 10MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('只允许上传图片文件'),
            false
          );
        }
        callback(null, true);
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '批量上传图片', description: '最多同时上传 9 张图片' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: '图片文件数组',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  async uploadImages(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('prefix') prefix?: string
  ): Promise<UploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('请选择要上传的图片');
    }

    return this.ossService.uploadFiles(files, { prefix: prefix || 'images' });
  }

  /**
   * 头像上传
   */
  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('只允许上传图片文件'),
            false
          );
        }
        callback(null, true);
      },
    })
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '上传头像', description: '上传用户头像，最大 2MB' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: '头像图片' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: '上传成功' })
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File
  ): Promise<UploadResult> {
    if (!file) {
      throw new BadRequestException('请选择要上传的头像');
    }

    return this.ossService.uploadFile(file, { prefix: 'avatars' });
  }

  /**
   * 删除文件
   */
  @Delete(':key')
  @ApiOperation({ summary: '删除文件', description: '根据 key 删除 OSS 文件' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteFile(@Param('key') key: string): Promise<{ success: boolean }> {
    // 解码 URL 编码的 key
    const decodedKey = decodeURIComponent(key);
    await this.ossService.deleteFile(decodedKey);
    return { success: true };
  }

  /**
   * 获取文件临时访问 URL
   */
  @Get('url/:key')
  @ApiOperation({ summary: '获取文件 URL', description: '获取文件临时访问 URL' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getFileUrl(
    @Param('key') key: string,
    @Query('expires') expires?: number
  ): Promise<{ url: string }> {
    const decodedKey = decodeURIComponent(key);
    const url = await this.ossService.getFileUrl(decodedKey, expires || 3600);
    return { url };
  }

  /**
   * 健康检查
   */
  @Get('health')
  @ApiOperation({ summary: 'OSS 服务健康检查' })
  @ApiResponse({ status: 200, description: '服务状态' })
  async healthCheck() {
    return this.ossService.healthCheck();
  }
}