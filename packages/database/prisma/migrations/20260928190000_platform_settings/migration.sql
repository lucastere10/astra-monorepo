-- Singleton platform settings. LLM copy stays on until an admin turns it off.

CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL,
    "llmCopyEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformSettings" ("id", "llmCopyEnabled", "updatedAt")
VALUES ('default', true, CURRENT_TIMESTAMP);
