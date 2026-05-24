-- VeriProp Nigeria Full Schema Migration
-- Multi-Sig + Split Payment + Audit + Chat

-- CreateEnum

-- Users
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL UNIQUE,
  "role" TEXT NOT NULL DEFAULT 'buyer',
  "verificationTier" TEXT NOT NULL DEFAULT 'NONE',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "isBanned" BOOLEAN NOT NULL DEFAULT false,
  "banReason" TEXT,
  "bannedAt" TIMESTAMPTZ,
  "bannedBy" TEXT,
  "bvnVerified" BOOLEAN NOT NULL DEFAULT false,
  "bvnHash" TEXT,
  "ninVerified" BOOLEAN NOT NULL DEFAULT false,
  "ninHash" TEXT,
  "govtIdType" TEXT,
  "govtIdVerified" BOOLEAN NOT NULL DEFAULT false,
  "govtIdUrl" TEXT,
  "smileJobId" TEXT,
  "notaryVerified" BOOLEAN NOT NULL DEFAULT false,
  "notaryDocUrl" TEXT,
  "notaryVerifiedAt" TIMESTAMPTZ,
  "notaryVerifiedBy" TEXT,
  "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
  "paystackRecipientCode" TEXT,
  "bankAccountName" TEXT,
  "bankAccountNumber" TEXT,
  "bankCode" TEXT,
  "fraudScore" INTEGER NOT NULL DEFAULT 0,
  "fraudFlags" TEXT[] DEFAULT '{}',
  "lastLoginAt" TIMESTAMPTZ,
  "lastLoginIp" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_phone_idx" ON "users"("phone");
CREATE INDEX "users_role_idx" ON "users"("role");

-- User Profiles
CREATE TABLE "user_profiles" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
  "displayName" TEXT NOT NULL,
  "bio" TEXT, "avatar" TEXT, "state" TEXT, "lga" TEXT,
  "address" TEXT, "website" TEXT, "linkedinUrl" TEXT,
  "cacNumber" TEXT, "licenseNumber" TEXT
);

-- Properties
CREATE TABLE "properties" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "propertyType" TEXT NOT NULL,
  "listingType" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "state" TEXT NOT NULL,
  "lga" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "landmark" TEXT,
  "bedrooms" INTEGER, "bathrooms" INTEGER, "toilets" INTEGER,
  "size" DOUBLE PRECISION, "sizeUnit" TEXT DEFAULT 'sqm',
  "amenities" TEXT[] DEFAULT '{}',
  "latitude" DOUBLE PRECISION, "longitude" DOUBLE PRECISION,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isVerified" BOOLEAN NOT NULL DEFAULT false,
  "titleDocVerified" BOOLEAN NOT NULL DEFAULT false,
  "moderationStatus" TEXT NOT NULL DEFAULT 'review_required',
  "moderationData" JSONB, "moderationScore" INTEGER,
  "moderatedBy" TEXT, "moderatedAt" TIMESTAMPTZ, "moderationReason" TEXT,
  "viewCount" INTEGER NOT NULL DEFAULT 0,
  "ownerId" TEXT NOT NULL REFERENCES "users"("id"),
  "deletedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "properties_state_status_idx" ON "properties"("state","status");
CREATE INDEX "properties_price_idx" ON "properties"("price");

-- Transactions
CREATE TABLE "transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "propertyId" TEXT NOT NULL REFERENCES "properties"("id"),
  "buyerId" TEXT NOT NULL REFERENCES "users"("id"),
  "sellerId" TEXT NOT NULL REFERENCES "users"("id"),
  "agentId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'initiated',
  "paymentPlan" TEXT NOT NULL DEFAULT 'full',
  "paymentReference" TEXT, "paidAt" TIMESTAMPTZ,
  "completedAt" TIMESTAMPTZ, "cancelledAt" TIMESTAMPTZ, "cancelReason" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Escrows
CREATE TABLE "escrows" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transactionId" TEXT NOT NULL UNIQUE REFERENCES "transactions"("id"),
  "buyerId" TEXT NOT NULL REFERENCES "users"("id"),
  "sellerId" TEXT NOT NULL REFERENCES "users"("id"),
  "propertyId" TEXT NOT NULL REFERENCES "properties"("id"),
  "agentId" TEXT,
  "totalDeposited" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "platformFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "agentCommission" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "vatAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "whtAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netSellerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'initiated',
  "multiSigStatus" TEXT NOT NULL DEFAULT 'pending',
  "paymentReference" TEXT, "paystackAuthCode" TEXT, "fundedAt" TIMESTAMPTZ,
  "inspectionPassed" BOOLEAN, "inspectionDate" TIMESTAMPTZ, "inspectionNotes" TEXT,
  "docsVerified" BOOLEAN NOT NULL DEFAULT false, "docsVerifiedAt" TIMESTAMPTZ, "docsVerifiedBy" TEXT,
  "releaseRequestedAt" TIMESTAMPTZ, "releasedAt" TIMESTAMPTZ, "releasedBy" TEXT,
  "payoutReference" TEXT, "refundedAt" TIMESTAMPTZ, "refundedBy" TEXT,
  "refundReason" TEXT, "refundReference" TEXT, "disputeId" TEXT,
  "timeline" JSONB, "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Multi-Sig Signatures
CREATE TABLE "multisig_signatures" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "escrowId" TEXT NOT NULL REFERENCES "escrows"("id"),
  "signerId" TEXT NOT NULL REFERENCES "users"("id"),
  "signerRole" TEXT NOT NULL,
  "signedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "signatureHash" TEXT NOT NULL,
  "ipAddress" TEXT, "userAgent" TEXT, "metadata" JSONB,
  UNIQUE("escrowId","signerRole")
);

-- Split Receipts
CREATE TABLE "split_receipts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "escrowId" TEXT NOT NULL REFERENCES "escrows"("id"),
  "transactionId" TEXT,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "platformFee" DOUBLE PRECISION NOT NULL,
  "platformFeeRef" TEXT,
  "agentCommission" DOUBLE PRECISION NOT NULL,
  "agentCommissionRef" TEXT,
  "vatAmount" DOUBLE PRECISION NOT NULL,
  "vatRef" TEXT,
  "whtAmount" DOUBLE PRECISION NOT NULL,
  "whtRef" TEXT,
  "netSellerAmount" DOUBLE PRECISION NOT NULL,
  "netSellerRef" TEXT,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "processedAt" TIMESTAMPTZ, "failureReason" TEXT, "retryCount" INTEGER NOT NULL DEFAULT 0,
  "platformVaultId" TEXT, "taxVaultId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Vaults
CREATE TABLE "vaults" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalIn" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalOut" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'NGN',
  "lastUpdatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "vault_transactions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "vaultId" TEXT NOT NULL REFERENCES "vaults"("id"),
  "amount" DOUBLE PRECISION NOT NULL,
  "type" TEXT NOT NULL,
  "reference" TEXT, "description" TEXT, "sourceId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chat
CREATE TABLE "chat_rooms" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "transactionId" TEXT UNIQUE REFERENCES "transactions"("id"),
  "name" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "chat_participants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "lastReadAt" TIMESTAMPTZ,
  UNIQUE("roomId","userId")
);

CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "roomId" TEXT NOT NULL REFERENCES "chat_rooms"("id") ON DELETE CASCADE,
  "senderId" TEXT NOT NULL REFERENCES "users"("id"),
  "content" TEXT NOT NULL,
  "originalContent" TEXT,
  "messageType" TEXT NOT NULL DEFAULT 'text',
  "isRedacted" BOOLEAN NOT NULL DEFAULT false,
  "redactedAt" TIMESTAMPTZ, "redactedReason" TEXT, "redactedBy" TEXT,
  "fileUrl" TEXT, "fileName" TEXT,
  "isRead" BOOLEAN NOT NULL DEFAULT false, "readAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "chat_messages_roomId_idx" ON "chat_messages"("roomId");

-- Audit Logs
CREATE TABLE "audit_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "action" TEXT NOT NULL,
  "userId" TEXT REFERENCES "users"("id"),
  "transactionId" TEXT REFERENCES "transactions"("id"),
  "resourceType" TEXT, "resourceId" TEXT,
  "description" TEXT NOT NULL,
  "metadata" JSONB, "ipAddress" TEXT, "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- Disputes
CREATE TABLE "disputes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "escrowId" TEXT NOT NULL REFERENCES "escrows"("id"),
  "initiatedBy" TEXT NOT NULL,
  "respondentId" TEXT,
  "reason" TEXT NOT NULL,
  "evidence" JSONB NOT NULL DEFAULT '[]',
  "status" TEXT NOT NULL DEFAULT 'open',
  "assignedTo" TEXT, "resolution" TEXT,
  "resolvedBy" TEXT, "resolvedAt" TIMESTAMPTZ, "timeline" JSONB,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Other supporting tables (otps, password_resets, notifications, support_tickets, etc.)
CREATE TABLE "otps" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "otp" TEXT NOT NULL, "type" TEXT NOT NULL, "expiresAt" TIMESTAMPTZ NOT NULL, "usedAt" TIMESTAMPTZ, "attempts" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "password_resets" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "token" TEXT NOT NULL UNIQUE, "expiresAt" TIMESTAMPTZ NOT NULL, "usedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "property_images" ("id" TEXT NOT NULL PRIMARY KEY, "propertyId" TEXT NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE, "url" TEXT NOT NULL, "isPrimary" BOOLEAN NOT NULL DEFAULT false, "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "property_documents" ("id" TEXT NOT NULL PRIMARY KEY, "propertyId" TEXT NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE, "name" TEXT NOT NULL, "url" TEXT NOT NULL, "documentType" TEXT NOT NULL, "isPublic" BOOLEAN NOT NULL DEFAULT false, "isVerified" BOOLEAN NOT NULL DEFAULT false, "verifiedBy" TEXT, "verifiedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "property_views" ("id" TEXT NOT NULL PRIMARY KEY, "propertyId" TEXT NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE, "userId" TEXT, "ip" TEXT, "userAgent" TEXT, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "favorites" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "propertyId" TEXT NOT NULL REFERENCES "properties"("id") ON DELETE CASCADE, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE("userId","propertyId"));
CREATE TABLE "split_escrows" ("id" TEXT NOT NULL PRIMARY KEY, "transactionId" TEXT UNIQUE, "propertyId" TEXT NOT NULL, "buyerId" TEXT NOT NULL, "sellerId" TEXT NOT NULL, "totalAmount" DOUBLE PRECISION NOT NULL, "downPayment" DOUBLE PRECISION NOT NULL, "balance" DOUBLE PRECISION NOT NULL, "installmentAmount" DOUBLE PRECISION NOT NULL, "totalInstallments" INTEGER NOT NULL, "paidInstallments" INTEGER NOT NULL DEFAULT 0, "schedule" JSONB NOT NULL, "status" TEXT NOT NULL DEFAULT 'active', "intervalDays" INTEGER NOT NULL DEFAULT 30, "nextDueDate" TIMESTAMPTZ, "completedAt" TIMESTAMPTZ, "defaultedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "legal_acceptances" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id"), "documentType" TEXT NOT NULL, "version" TEXT NOT NULL, "acceptedAt" TIMESTAMPTZ NOT NULL, "ipAddress" TEXT, "userAgent" TEXT);
CREATE TABLE "legal_documents" ("id" TEXT NOT NULL PRIMARY KEY, "transactionId" TEXT NOT NULL REFERENCES "transactions"("id"), "type" TEXT NOT NULL, "content" TEXT NOT NULL, "version" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'draft', "signedByBuyer" BOOLEAN NOT NULL DEFAULT false, "buyerSignedAt" TIMESTAMPTZ, "buyerSignHash" TEXT, "signedBySeller" BOOLEAN NOT NULL DEFAULT false, "sellerSignedAt" TIMESTAMPTZ, "sellerSignHash" TEXT, "signedByNotary" BOOLEAN NOT NULL DEFAULT false, "notarySignedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "notifications" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "type" TEXT NOT NULL DEFAULT 'info', "isRead" BOOLEAN NOT NULL DEFAULT false, "readAt" TIMESTAMPTZ, "data" JSONB, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE "support_tickets" ("id" TEXT NOT NULL PRIMARY KEY, "userId" TEXT NOT NULL REFERENCES "users"("id"), "ticketNumber" TEXT NOT NULL UNIQUE, "subject" TEXT NOT NULL, "message" TEXT NOT NULL, "category" TEXT NOT NULL DEFAULT 'general', "priority" TEXT NOT NULL DEFAULT 'normal', "status" TEXT NOT NULL DEFAULT 'open', "assignedTo" TEXT, "resolution" TEXT, "resolvedAt" TIMESTAMPTZ, "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(), "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW());

-- Insert default vaults
INSERT INTO "vaults" ("id","name","balance","totalIn","totalOut") VALUES
  (gen_random_uuid()::text,'platform_fee',0,0,0),
  (gen_random_uuid()::text,'agent_commission',0,0,0),
  (gen_random_uuid()::text,'vat_pool',0,0,0),
  (gen_random_uuid()::text,'wht_pool',0,0,0);

-- SessionLog table (AUDIT GAP 4 FIX)
CREATE TABLE "session_logs" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "users"("id"),
  "event" TEXT NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "country" TEXT,
  "city" TEXT,
  "deviceType" TEXT,
  "success" BOOLEAN NOT NULL DEFAULT true,
  "failReason" TEXT,
  "sessionToken" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "session_logs_userId_idx" ON "session_logs"("userId");
CREATE INDEX "session_logs_event_idx" ON "session_logs"("event");
CREATE INDEX "session_logs_createdAt_idx" ON "session_logs"("createdAt");
