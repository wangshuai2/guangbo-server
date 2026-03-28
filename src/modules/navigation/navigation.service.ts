import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/utils/prisma.service';

interface NavigationParams {
  museumId: number;
  userLat?: number;
  userLng?: number;
}

@Injectable()
export class NavigationService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取博物馆导航信息
   */
  async getNavigationInfo(params: NavigationParams) {
    const { museumId, userLat, userLng } = params;

    // 1. 获取博物馆信息
    const museum = await this.prisma.museum.findUnique({
      where: { id: museumId },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!museum) {
      throw new Error('博物馆不存在');
    }

    if (!museum.latitude || !museum.longitude) {
      throw new Error('该博物馆暂不支持导航');
    }

    // 2. 计算距离（如果提供了用户位置）
    let distance = null;
    let estimatedTime = null;
    
    if (userLat && userLng) {
      distance = this.calculateDistance(
        userLat,
        userLng,
        museum.latitude,
        museum.longitude,
      );
      // 估算时间（假设步行速度 5km/h，驾车速度 40km/h）
      estimatedTime = {
        walking: Math.round((distance / 5) * 60), // 分钟
        driving: Math.round((distance / 40) * 60), // 分钟
      };
    }

    // 3. 生成导航链接
    const navigationLinks = this.generateNavigationLinks(
      museum.latitude,
      museum.longitude,
      museum.name,
      museum.address,
    );

    return {
      museum: {
        id: museum.id,
        name: museum.name,
        address: museum.address,
        latitude: museum.latitude,
        longitude: museum.longitude,
      },
      distance: distance ? Math.round(distance * 100) / 100 : null, // km，保留2位小数
      estimatedTime,
      navigationLinks,
    };
  }

  /**
   * 批量获取博物馆导航信息
   */
  async getBatchNavigationInfo(
    museumIds: number[],
    userLat?: number,
    userLng?: number,
  ) {
    const museums = await this.prisma.museum.findMany({
      where: {
        id: { in: museumIds },
        latitude: { not: null },
        longitude: { not: null },
      },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    });

    return museums.map((museum) => {
      let distance = null;
      
      if (userLat && userLng && museum.latitude && museum.longitude) {
        distance = this.calculateDistance(
          userLat,
          userLng,
          museum.latitude,
          museum.longitude,
        );
      }

      return {
        id: museum.id,
        name: museum.name,
        address: museum.address,
        latitude: museum.latitude,
        longitude: museum.longitude,
        distance: distance ? Math.round(distance * 100) / 100 : null,
      };
    }).sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });
  }

  /**
   * 计算两点间距离（Haversine公式）
   */
  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * 生成导航链接
   */
  private generateNavigationLinks(
    lat: number,
    lng: number,
    name: string,
    address: string,
  ) {
    const encodedName = encodeURIComponent(name);
    const encodedAddress = encodeURIComponent(address || '');

    return {
      // 高德地图
      amap: {
        web: `https://uri.amap.com/marker?position=${lng},${lat}&name=${encodedName}&coordinate=gaode`,
        app: `androidamap://viewMap?sourceApplication=guangbo&poiname=${encodedName}&lat=${lat}&lon=${lng}&dev=0`,
        ios: `iosamap://viewMap?sourceApplication=guangbo&poiname=${encodedName}&lat=${lat}&lon=${lng}&dev=0`,
      },
      // 百度地图
      baidu: {
        web: `https://api.map.baidu.com/marker?location=${lat},${lng}&title=${encodedName}&content=${encodedAddress}&output=html`,
        app: `baidumap://map/marker?location=${lat},${lng}&title=${encodedName}&content=${encodedAddress}&src=guangbo`,
      },
      // 腾讯地图
      tencent: {
        web: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${lat},${lng};title:${encodedName};addr:${encodedAddress}`,
        app: `qqmap://map/routeplan?type=drive&to=${encodedName}&tocoord=${lat},${lng}&referer=guangbo`,
      },
      // 系统地图
      apple: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodedName}`,
      google: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    };
  }
}