# 逛博 APP 后端 API 文档

**Base URL**: `http://localhost:3000`（开发环境）

**认证方式**: JWT Bearer Token（部分接口需要）

---

## 认证模块 `/v1/auth`

### 1. 微信登录
```
POST /v1/auth/wechat-login
Content-Type: application/json

请求体：
{
  "code": "string",        // 微信授权码
  "userInfo": {            // 可选，用户信息
    "nickname": "string",
    "avatar": "string"
  }
}

响应：
{
  "code": 0,
  "data": {
    "accessToken": "string",
    "refreshToken": "string",
    "expiresIn": 7200,
    "user": {
      "id": "1",
      "nickname": "string",
      "avatar": "string",
      "level": 1,
      "exp": 0
    }
  }
}
```

### 2. 刷新 Token
```
POST /v1/auth/refresh-token
Authorization: Bearer <refreshToken>

响应：
{
  "code": 0,
  "data": {
    "accessToken": "string",
    "expiresIn": 7200
  }
}
```

---

## 博物馆模块 `/v1/museums`

### 1. 获取博物馆列表
```
GET /v1/museums?page=1&pageSize=20&province=北京市&type=history

参数：
- page: number (默认 1)
- pageSize: number (默认 20)
- province: string (可选)
- city: string (可选)
- type: string (可选) - history/art/science/nature/general
- isFree: boolean (可选)
- rating: number (可选) - 最低评分
- keyword: string (可选) - 搜索关键词

响应：
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "1",
        "name": "故宫博物院",
        "province": "北京市",
        "city": "北京市",
        "address": "北京市东城区景山前街4号",
        "coverImage": "string",
        "type": "history",
        "isFree": false,
        "rating": 4.9,
        "ratingCount": 50000,
        "checkinCount": 100000
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 200,
      "totalPages": 10,
      "hasMore": true
    }
  }
}
```

### 2. 获取附近博物馆
```
GET /v1/museums/nearby?lat=39.9163&lng=116.3972&distance=5000&limit=10

参数：
- lat: number (必填) - 纬度
- lng: number (必填) - 经度
- distance: number (可选) - 距离范围(米)，默认 5000
- limit: number (可选) - 返回数量，默认 10

响应：
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "1",
        "name": "故宫博物院",
        "address": "string",
        "coverImage": "string",
        "rating": 4.9,
        "distance": 500
      }
    ]
  }
}
```

### 3. 获取博物馆详情
```
GET /v1/museums/:id
Authorization: Bearer <token> (可选，登录后显示打卡/收藏状态)

响应：
{
  "code": 0,
  "data": {
    "id": "1",
    "name": "故宫博物院",
    "province": "北京市",
    "city": "北京市",
    "address": "string",
    "latitude": 39.9163,
    "longitude": 116.3972,
    "type": "history",
    "description": "string",
    "coverImage": "string",
    "ticketInfo": "免费（需预约）",
    "isFree": true,
    "phone": "010-85007421",
    "website": "https://www.dpm.org.cn",
    "rating": 4.9,
    "ratingCount": 50000,
    "checkinCount": 100000,
    "isCheckin": false,      // 登录后返回
    "isFavorited": false,    // 登录后返回
    "treasures": [           // 镇馆之宝
      {
        "id": "1",
        "name": "清明上河图",
        "description": "string",
        "period": "北宋"
      }
    ]
  }
}
```

---

## 打卡模块 `/v1/checkin`

### 1. 打卡
```
POST /v1/checkin
Authorization: Bearer <token>
Content-Type: application/json

请求体：
{
  "museumId": "1",          // 博物馆ID（字符串）
  "latitude": 39.9163,      // 用户纬度
  "longitude": 116.3972,    // 用户经度
  "accuracy": 50            // 可选，定位精度(米)
}

响应：
{
  "code": 0,
  "data": {
    "success": true,
    "exp": 10,              // 获得经验值
    "message": "打卡成功！获得 10 经验值",
    "unlockedMedals": [     // 解锁的勋章
      {
        "id": "1",
        "name": "初出茅庐",
        "expReward": 20
      }
    ],
    "levelUp": false,       // 是否升级
    "newLevel": 2           // 新等级
  }
}
```

### 2. 获取打卡记录
```
GET /v1/checkin/history?page=1&limit=20
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "1",
        "museum": {
          "id": "1",
          "name": "故宫博物院",
          "province": "北京市",
          "city": "北京市",
          "coverImage": "string"
        },
        "checkedAt": "2026-03-24T10:00:00Z",
        "distance": 50
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "hasMore": false
    }
  }
}
```

### 3. 获取打卡统计
```
GET /v1/checkin/statistics
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "data": {
    "total": 10,            // 打卡总数
    "provinces": 5,         // 打卡省份数
    "medals": 2,            // 解锁勋章数
    "byType": {             // 按类型统计
      "history": 5,
      "art": 3,
      "science": 2
    }
  }
}
```

---

## 勋章模块 `/v1/medals`

### 1. 获取勋章列表
```
GET /v1/medals
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "1",
        "code": "FOOTPRINT_001",
        "name": "初出茅庐",
        "description": "首次打卡博物馆",
        "type": "checkin",
        "icon": "/medals/footprint-001.png",
        "expReward": 20,
        "rarity": "common",      // common/rare/epic/legendary
        "unlocked": true,
        "progress": 100          // 进度百分比
      },
      {
        "id": "2",
        "name": "足迹初现",
        "description": "打卡3个博物馆",
        "unlocked": false,
        "progress": 33           // 1/3
      }
    ]
  }
}
```

### 2. 获取我的勋章
```
GET /v1/medals/my
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "1",
        "name": "初出茅庐",
        "description": "首次打卡博物馆",
        "expReward": 20,
        "rarity": "common",
        "unlockedAt": "2026-03-24T10:00:00Z"
      }
    ]
  }
}
```

### 3. 获取勋章详情
```
GET /v1/medals/:id
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "data": {
    "id": "1",
    "code": "FOOTPRINT_001",
    "name": "初出茅庐",
    "description": "首次打卡博物馆",
    "type": "checkin",
    "conditionType": "checkin_count",
    "conditionValue": 1,
    "expReward": 20,
    "rarity": "common",
    "unlocked": true,
    "unlockedAt": "2026-03-24T10:00:00Z",
    "progress": 100
  }
}
```

---

## 用户模块 `/v1/users`

### 获取用户信息
```
GET /v1/users/:id
Authorization: Bearer <token>

响应：
{
  "code": 0,
  "data": {
    "id": "1",
    "nickname": "逛博用户",
    "avatar": "string",
    "level": 3,
    "exp": 350,
    "medalCount": 2,
    "checkinCount": 10,
    "provinceCount": 5
  }
}
```

---

## 错误响应格式

```json
{
  "code": 400,
  "message": "错误描述",
  "errors": [
    {
      "field": "museumId",
      "message": "博物馆ID不能为空"
    }
  ]
}
```

**常见错误码**：
- 400: 请求参数错误
- 401: 未授权（未登录或 Token 过期）
- 403: 禁止访问（无权限）
- 404: 资源不存在
- 500: 服务器内部错误

---

## 启动后端服务

```bash
cd ~/.copaw-worker/xiaofu/workspace/guangbo-server

# 启动数据库
docker-compose up -d

# 运行迁移
npx prisma migrate dev

# 导入数据
npx ts-node prisma/seed.ts

# 启动开发服务
npm run start:dev
```

**API 文档**: http://localhost:3000/api

---

## 数据库状态

- 200 个博物馆数据
- 4 枚勋章配置
  - 初出茅庐（打卡 1 个）
  - 足迹初现（打卡 3 个）
  - 走遍四方（打卡 10 个省份）
  - 博物达人（打卡 50 个）