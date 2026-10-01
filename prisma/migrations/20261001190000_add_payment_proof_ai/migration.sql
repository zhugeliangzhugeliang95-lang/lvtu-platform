ALTER TABLE "MembershipPayment" ADD COLUMN "proofImage" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN "proofAiStatus" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN "proofAiSummary" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN "proofAiJson" TEXT;
ALTER TABLE "MembershipPayment" ADD COLUMN "proofAiCheckedAt" DATETIME;

ALTER TABLE "Payment" ADD COLUMN "proofAiStatus" TEXT;
ALTER TABLE "Payment" ADD COLUMN "proofAiSummary" TEXT;
ALTER TABLE "Payment" ADD COLUMN "proofAiJson" TEXT;
ALTER TABLE "Payment" ADD COLUMN "proofAiCheckedAt" DATETIME;
