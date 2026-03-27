import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

@Injectable()
export class MuseumService {
  constructor(private prisma: PrismaService) {}

  // 博物馆列表（分页）
  async findAll(page: number = 1, pageSize: number = 10, keyword?: string) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.museum.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.museum.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  // 博物馆详情
  async findOne(id: number) {
    const museum = await this.prisma.museum.findUnique({
      where: { id },
    });

    if (!museum) {
      throw new NotFoundException('博物馆不存在');
    }

    return museum;
  }

  // 创建博物馆
  async create(data: any) {
    return this.prisma.museum.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        longitude: data.longitude,
        latitude: data.latitude,
        coverImage: data.coverImage,
        provinceId: data.provinceId,
        cityId: data.cityId,
        districtId: data.districtId,
        isActive: data.isActive ?? true,
      },
    });
  }

  // 更新博物馆
  async update(id: number, data: any) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.museum.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        longitude: data.longitude,
        latitude: data.latitude,
        coverImage: data.coverImage,
        provinceId: data.provinceId,
        cityId: data.cityId,
        districtId: data.districtId,
        isActive: data.isActive,
      },
    });
  }

  // 删除博物馆
  async remove(id: number) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.museum.delete({
      where: { id },
    });
  }

  // 切换博物馆状态
  async toggle(id: number) {
    const museum = await this.findOne(id);

    return this.prisma.museum.update({
      where: { id },
      data: { isActive: !museum.isActive },
    });
  }
}