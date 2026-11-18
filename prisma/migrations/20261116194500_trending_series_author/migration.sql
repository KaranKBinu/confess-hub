-- AlterTable
ALTER TABLE "User" ADD COLUMN "showUsernameOnPosts" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN "authorUserId" TEXT,
ADD COLUMN "showAuthor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "seriesId" VARCHAR(64),
ADD COLUMN "partIndex" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "partTotal" INTEGER;

-- CreateIndex
CREATE INDEX "Post_seriesId_partIndex_idx" ON "Post"("seriesId", "partIndex");

-- CreateTable
CREATE TABLE "TrendingEntry" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "language" "PostLanguage" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "signals" JSONB NOT NULL,
    "rankedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrendingEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrendingEntry_postId_key" ON "TrendingEntry"("postId");

-- CreateIndex
CREATE INDEX "TrendingEntry_language_score_idx" ON "TrendingEntry"("language", "score");

-- CreateIndex
CREATE INDEX "TrendingEntry_rankedAt_idx" ON "TrendingEntry"("rankedAt");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrendingEntry" ADD CONSTRAINT "TrendingEntry_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;