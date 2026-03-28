-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "openid" TEXT NOT NULL,
    "union_id" TEXT,
    "nickname" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "level" INTEGER NOT NULL DEFAULT 1,
    "exp" INTEGER NOT NULL DEFAULT 0,
    "medal_count" INTEGER NOT NULL DEFAULT 0,
    "checkin_count" INTEGER NOT NULL DEFAULT 0,
    "province_count" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "last_login_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "museums" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "type" TEXT,
    "description" TEXT,
    "cover_image" TEXT,
    "open_time" TEXT,
    "ticket_info" TEXT,
    "is_free" INTEGER NOT NULL DEFAULT 0,
    "phone" TEXT,
    "website" TEXT,
    "rating" REAL NOT NULL DEFAULT 0.0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "checkin_count" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "treasures" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "museum_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "period" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "treasures_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "museum_id" INTEGER NOT NULL,
    "latitude" REAL,
    "longitude" REAL,
    "accuracy" INTEGER,
    "distance" INTEGER,
    "ip_address" TEXT,
    "device_info" TEXT,
    "checked_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_ins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "check_ins_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "medals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "condition_type" TEXT,
    "condition_value" INTEGER,
    "icon" TEXT,
    "exp_reward" INTEGER NOT NULL DEFAULT 0,
    "rarity" TEXT NOT NULL DEFAULT 'common',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "user_medals" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "medal_id" INTEGER NOT NULL,
    "unlocked_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_medals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_medals_medal_id_fkey" FOREIGN KEY ("medal_id") REFERENCES "medals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "museum_id" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorites_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "favorites_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "museum_id" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ratings_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "posts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "museum_id" INTEGER,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "images" TEXT,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "is_featured" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "posts_museum_id_fkey" FOREIGN KEY ("museum_id") REFERENCES "museums" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "comment" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "operation_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "target_type" TEXT,
    "target_id" INTEGER,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "users_openid_key" ON "users"("openid");

-- CreateIndex
CREATE INDEX "museums_province_city_idx" ON "museums"("province", "city");

-- CreateIndex
CREATE INDEX "museums_type_idx" ON "museums"("type");

-- CreateIndex
CREATE INDEX "treasures_museum_id_sort_order_idx" ON "treasures"("museum_id", "sort_order");

-- CreateIndex
CREATE INDEX "check_ins_user_id_checked_at_idx" ON "check_ins"("user_id", "checked_at");

-- CreateIndex
CREATE INDEX "check_ins_museum_id_idx" ON "check_ins"("museum_id");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_user_id_museum_id_key" ON "check_ins"("user_id", "museum_id");

-- CreateIndex
CREATE UNIQUE INDEX "medals_code_key" ON "medals"("code");

-- CreateIndex
CREATE INDEX "medals_type_idx" ON "medals"("type");

-- CreateIndex
CREATE INDEX "medals_sort_order_idx" ON "medals"("sort_order");

-- CreateIndex
CREATE INDEX "user_medals_user_id_idx" ON "user_medals"("user_id");

-- CreateIndex
CREATE INDEX "user_medals_medal_id_idx" ON "user_medals"("medal_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_medals_user_id_medal_id_key" ON "user_medals"("user_id", "medal_id");

-- CreateIndex
CREATE INDEX "favorites_user_id_created_at_idx" ON "favorites"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_user_id_museum_id_key" ON "favorites"("user_id", "museum_id");

-- CreateIndex
CREATE INDEX "ratings_museum_id_idx" ON "ratings"("museum_id");

-- CreateIndex
CREATE INDEX "ratings_user_id_created_at_idx" ON "ratings"("user_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "ratings_user_id_museum_id_key" ON "ratings"("user_id", "museum_id");

-- CreateIndex
CREATE INDEX "posts_user_id_created_at_idx" ON "posts"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "posts_museum_id_created_at_idx" ON "posts"("museum_id", "created_at");

-- CreateIndex
CREATE INDEX "posts_status_created_at_idx" ON "posts"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_key_key" ON "system_configs"("key");

-- CreateIndex
CREATE INDEX "operation_logs_user_id_idx" ON "operation_logs"("user_id");

-- CreateIndex
CREATE INDEX "operation_logs_action_idx" ON "operation_logs"("action");

-- CreateIndex
CREATE INDEX "operation_logs_created_at_idx" ON "operation_logs"("created_at");
