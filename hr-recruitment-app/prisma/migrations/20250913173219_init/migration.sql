-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'recruiter',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "recruiterName" TEXT NOT NULL,
    "recruiterDetails" TEXT,
    "recruiterDesignation" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyDescription" TEXT,
    "postedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" DATETIME NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "recruiterId" TEXT NOT NULL,
    CONSTRAINT "jobs_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "linkedinUrl" TEXT,
    "skills" TEXT NOT NULL,
    "experience" TEXT,
    "projects" TEXT,
    "education" TEXT,
    "certificates" TEXT,
    "endorsements" TEXT,
    "currentJobTitle" TEXT,
    "currentEmployer" TEXT,
    "openToWork" BOOLEAN NOT NULL DEFAULT true,
    "linkedinInMailSent" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "candidateLocation" TEXT,
    "score" INTEGER DEFAULT 0,
    "scoreDescription" TEXT,
    "interviewLink" TEXT,
    "interviewDate" DATETIME,
    "lastContactedDate" DATETIME,
    "candidateHrConversation" TEXT,
    "followUpCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "jobId" TEXT NOT NULL,
    CONSTRAINT "candidates_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");
