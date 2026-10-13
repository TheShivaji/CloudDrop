/**
 * S3 Client Configuration
 *
 * Credential resolution order (AWS SDK v3 default provider chain):
 *   1. Environment variables: AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
 *      (for local development — run `aws configure` or export them)
 *   2. ~/.aws/credentials and ~/.aws/config (shared credentials file)
 *   3. ECS task role credentials (if running on ECS)
 *   4. EC2 Instance Metadata Service v2 (IMDSv2) — USED IN PRODUCTION
 *      The IAM role attached to your EC2 instance is automatically used.
 *
 * ⚠️  Never add AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY to the .env
 *     file on EC2. Attach an IAM role to the instance instead.
 */

import { S3Client } from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;

if (!region) {
  throw new Error(
    "[S3 Config] AWS_REGION is not set. " +
      "Check your .env file or EC2 instance environment."
  );
}

// The S3Client constructor does not accept credentials here —
// the SDK resolves them automatically at request time.
const s3Client = new S3Client({ region });

export default s3Client;
