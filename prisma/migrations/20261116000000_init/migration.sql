CREATE TYPE "PostLanguage" AS ENUM ('en', 'ml', 'hi');
CREATE TYPE "PostStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "language" "PostLanguage" NOT NULL,
    "anonymousId" VARCHAR(64) NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'PENDING',
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "reporterAnonymousId" VARCHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Post_status_language_createdAt_idx" ON "Post"("status", "language", "createdAt");
CREATE INDEX "Post_isFlagged_createdAt_idx" ON "Post"("isFlagged", "createdAt");
CREATE UNIQUE INDEX "Report_postId_reporterAnonymousId_key" ON "Report"("postId", "reporterAnonymousId");
CREATE INDEX "Report_postId_createdAt_idx" ON "Report"("postId", "createdAt");

ALTER TABLE "Report" ADD CONSTRAINT "Report_postId_fkey"
    FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;