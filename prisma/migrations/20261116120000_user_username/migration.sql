-- AlterTable
ALTER TABLE "User" ADD COLUMN "username" VARCHAR(30);

UPDATE "User" SET "username" = 'user_' || LEFT("id", 8) WHERE "username" IS NULL;

ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");