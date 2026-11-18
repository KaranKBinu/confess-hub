-- CreateTable
CREATE TABLE "ContentFilterToken" (
    "id" TEXT NOT NULL,
    "token" VARCHAR(80) NOT NULL,
    "language" "PostLanguage" NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentFilterToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentFilterToken_token_language_key" ON "ContentFilterToken"("token", "language");

-- CreateIndex
CREATE INDEX "ContentFilterToken_language_frequency_idx" ON "ContentFilterToken"("language", "frequency");