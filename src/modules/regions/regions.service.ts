import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';
import {
  CreateRegionDto,
  UpdateRegionDto,
  RegionTreeDto,
} from './dto/region.dto';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  // 获取地区列表
  async findAll(type?: string, isActive?: boolean) {
    const where: any = {};
    if (type) where.type = type;
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.region.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  // 获取省份列表
  async getProvinces(isActive?: boolean) {
    const where: any = { type: 'province' };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.region.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  // 获取城市列表（按省份）
  async getCitiesByProvince(provinceId: number, isActive?: boolean) {
    const where: any = { type: 'city', parentId: provinceId };
    if (isActive !== undefined) where.isActive = isActive;

    return this.prisma.region.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });
  }

  // 获取地区树（支持 Redis 缓存）
  async getRegionTree(isActive?: boolean): Promise<RegionTreeDto[]> {
    // TODO: 添加 Redis 缓存
    // const cacheKey = 'regions:tree';
    // const cached = await this.redis.get(cacheKey);
    // if (cached) return JSON.parse(cached);

    const where = isActive !== undefined ? { isActive } : {};

    // 获取所有地区
    const regions = await this.prisma.region.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    // 构建树结构
    const regionMap = new Map<number, RegionTreeDto>();
    const rootNodes: RegionTreeDto[] = [];

    // 第一遍：创建所有节点
    for (const region of regions) {
      regionMap.set(region.id, {
        id: region.id,
        name: region.name,
        type: region.type as any,
        code: region.code || undefined,
        isActive: region.isActive,
        children: [],
      });
    }

    // 第二遍：建立父子关系
    for (const region of regions) {
      const node = regionMap.get(region.id)!;
      if (region.parentId && regionMap.has(region.parentId)) {
        const parent = regionMap.get(region.parentId)!;
        parent.children!.push(node);
      } else if (region.type === 'province') {
        rootNodes.push(node);
      }
    }

    // TODO: 缓存结果
    // await this.redis.set(cacheKey, JSON.stringify(rootNodes), 'EX', 3600);

    return rootNodes;
  }

  // 获取单个地区
  async findOne(id: number) {
    const region = await this.prisma.region.findUnique({
      where: { id },
      include: { children: true },
    });

    if (!region) {
      throw new NotFoundException(`地区 #${id} 不存在`);
    }

    return region;
  }

  // 创建地区
  async create(createRegionDto: CreateRegionDto) {
    // 如果有父级，检查父级是否存在
    if (createRegionDto.parentId) {
      const parent = await this.prisma.region.findUnique({
        where: { id: createRegionDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `父级地区 #${createRegionDto.parentId} 不存在`,
        );
      }
    }

    // 检查代码是否重复
    if (createRegionDto.code) {
      const existing = await this.prisma.region.findFirst({
        where: { code: createRegionDto.code },
      });
      if (existing) {
        throw new ConflictException(
          `行政区划代码 ${createRegionDto.code} 已存在`,
        );
      }
    }

    return this.prisma.region.create({
      data: createRegionDto,
    });
  }

  // 更新地区
  async update(id: number, updateRegionDto: UpdateRegionDto) {
    await this.findOne(id); // 检查是否存在

    // 如果更新了父级，检查父级是否存在且不能是自己
    if (updateRegionDto.parentId) {
      if (updateRegionDto.parentId === id) {
        throw new ConflictException('父级地区不能是自己');
      }
      const parent = await this.prisma.region.findUnique({
        where: { id: updateRegionDto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(
          `父级地区 #${updateRegionDto.parentId} 不存在`,
        );
      }
    }

    // 检查代码是否重复
    if (updateRegionDto.code) {
      const existing = await this.prisma.region.findFirst({
        where: { code: updateRegionDto.code, NOT: { id } },
      });
      if (existing) {
        throw new ConflictException(
          `行政区划代码 ${updateRegionDto.code} 已存在`,
        );
      }
    }

    return this.prisma.region.update({
      where: { id },
      data: updateRegionDto,
    });
  }

  // 删除地区（级联删除子地区）
  async remove(id: number) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.region.delete({
      where: { id },
    });
  }

  // 切换地区状态
  async toggle(id: number, isActive: boolean) {
    await this.findOne(id); // 检查是否存在

    return this.prisma.region.update({
      where: { id },
      data: { isActive },
    });
  }

  // 清除地区缓存
  async clearCache() {
    // TODO: 清除 Redis 缓存
    // await this.redis.del('regions:tree');
    return { message: '缓存已清除' };
  }
}
