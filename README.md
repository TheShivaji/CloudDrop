# ☁️ CloudDrop

A modern, dark-themed cloud file management platform built with **React + Vite** on the frontend and **Node.js + Express** on the backend. Files are stored in a **private Amazon S3 bucket**. AWS credentials are never exposed to the browser — all S3 operations happen on the backend through the AWS SDK v3 default credential provider chain.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Folder Structure](#2-folder-structure)
3. [Local Installation](#3-local-installation)
4. [Environment Variable Setup](#4-environment-variable-setup)
5. [API Endpoint Documentation](#5-api-endpoint-documentation)
6. [How S3 Integration Works](#6-how-s3-integration-works)
7. [Security Considerations](#7-security-considerations)
8. [AWS EC2 Deployment](#8-aws-ec2-deployment)
9. [Troubleshooting](#9-troubleshooting)

---

## 1. Architecture Overview

```
Browser
  │
  │  (dev)  Vite proxy /api → localhost:5000
  │  (prod) Nginx proxy /api → localhost:5000
  │
  ├── GET /api/files             → Express → S3 ListObjectsV2
  ├── POST /api/files/upload     → Express → S3 PutObject
  ├── GET /api/files/download/:token → Express → S3 presigned URL (302 redirect)
  └── DELETE /api/files/:token   → Express → S3 DeleteObject

AWS EC2 (Ubuntu)
  ├── Nginx  — serves React dist/ + proxies /api
  ├── PM2    — keeps Node.js server alive
  └── IAM Role (attached to EC2) — grants S3 access, no keys needed
```

Key design decisions:

| Decision | Rationale |
|---|---|
| `/api` base path everywhere | Vite proxy (dev) and Nginx (prod) both intercept `/api` — zero frontend config change between environments |
| Presigned download URLs | Browser downloads directly from S3 with a 15-min signed URL. Backend streams nothing; S3 bucket stays private |
| Base64url key tokens | S3 keys contain `/` which breaks URL params. Keys are encoded when listed and decoded+validated server-side |
| IAM role on EC2 | No credentials in environment files on the server. SDK auto-discovers the role via IMDSv2 |
| Multer memory storage | Files buffer in RAM (max 100 MB), then streamed to S3 as a single PutObject call |
| Concurrency cap | Server rejects more than 5 simultaneous uploads with HTTP 429 |

---

## 2. Folder Structure

```
CloudDrop/
├── .gitignore
├── README.md
│
├── client/                        React + Vite + Tailwind CSS
│   ├── public/
│   ├── src/
│   │   ├── api/filesApi.js        All Axios calls to backend
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── TopBar.jsx
│   │   │   ├── files/
│   │   │   │   ├── FileList.jsx
│   │   │   │   ├── FileCard.jsx
│   │   │   │   └── DeleteConfirmModal.jsx
│   │   │   ├── upload/
│   │   │   │   └── UploadZone.jsx
│   │   │   └── ui/
│   │   │       ├── StorageOverview.jsx
│   │   │       ├── EmptyState.jsx
│   │   │       └── ProgressBar.jsx
│   │   ├── hooks/
│   │   │   ├── useFiles.js
│   │   │   └── useUpload.js
│   │   ├── utils/formatters.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── server/                        Node.js + Express + AWS SDK v3
    ├── src/
    │   ├── config/s3.js           S3Client (no hardcoded credentials)
    │   ├── middleware/
    │   │   ├── upload.js          Multer: memory, 100 MB, MIME allowlist
    │   │   └── errorHandler.js    Centralised error responses
    │   └── routes/files.js        All 5 route handlers
    ├── .env.example
    ├── app.js
    ├── server.js
    └── package.json
```

---

## 3. Local Installation

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- AWS CLI configured locally (`aws configure`) **OR** exported env vars:
  ```bash
  export AWS_ACCESS_KEY_ID=...
  export AWS_SECRET_ACCESS_KEY=...
  ```
- A private S3 bucket (see [S3 Integration](#6-how-s3-integration-works))

### Install and run

```bash
# 1. Clone the repository
git clone https://github.com/your-org/clouddrop.git
cd clouddrop

# 2. Install server dependencies
cd server
npm install

# 3. Configure server environment
cp .env.example .env
# Edit .env — set AWS_REGION and S3_BUCKET_NAME

# 4. Start the backend (port 5000)
npm run dev

# ── In a second terminal ──

# 5. Install client dependencies
cd ../client
npm install

# 6. (Optional) copy client env — defaults work out of the box
cp .env.example .env

# 7. Start the frontend (port 5173)
npm run dev
```

Open **http://localhost:5173** in your browser. The Vite dev server proxies all `/api` requests to `localhost:5000` automatically.

---

## 4. Environment Variable Setup

### `server/.env`

```dotenv
PORT=5000
AWS_REGION=ap-south-1
S3_BUCKET_NAME=your-bucket-name
CORS_ORIGIN=http://localhost:5173
```

> ⚠️ **Never add AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY here.**
> Use `aws configure` for local development.
> On EC2, attach an IAM role to the instance (see [Deployment](#8-aws-ec2-deployment)).

### `client/.env`

```dotenv
# Leave empty — Vite proxy handles /api in dev, Nginx handles it in prod.
VITE_API_BASE_URL=
```

---

## 5. API Endpoint Documentation

Base path: `/api`

All error responses use the shape: `{ "error": "Human-readable message" }`

### `GET /api/health`

Returns server status, configured region, and whether the bucket name is set.

**Response 200:**
```json
{
  "status": "ok",
  "service": "clouddrop-server",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "region": "ap-south-1",
  "bucket": "configured"
}
```

---

### `GET /api/files`

Lists all objects under the `uploads/` prefix in S3.

**Response 200:**
```json
{
  "files": [
    {
      "key": "<base64url-encoded-s3-key>",
      "name": "report.pdf",
      "size": 204800,
      "sizeFormatted": "200 KB",
      "lastModified": "2024-06-01T12:00:00.000Z",
      "storageClass": "STANDARD"
    }
  ],
  "summary": {
    "count": 1,
    "totalSize": 204800,
    "totalSizeFormatted": "200 KB"
  }
}
```

---

### `POST /api/files/upload`

Upload a single file. Expects `multipart/form-data` with field name `file`.

Limits: max 100 MB, allowed MIME types only, max 5 concurrent uploads.

**Response 201:**
```json
{
  "message": "File uploaded successfully.",
  "file": {
    "key": "<base64url-encoded-s3-key>",
    "name": "photo.jpg",
    "size": 512000,
    "sizeFormatted": "500 KB",
    "contentType": "image/jpeg",
    "uploadedAt": "2024-06-01T12:00:00.000Z"
  }
}
```

**Error responses:**
| Status | Condition |
|---|---|
| 400 | No file provided |
| 413 | File exceeds 100 MB |
| 415 | MIME type not allowed |
| 429 | More than 5 concurrent uploads |
| 500 | S3 PutObject failed |

---

### `GET /api/files/download/:token`

Generates a 15-minute presigned S3 URL and returns an HTTP 302 redirect to it. The browser follows the redirect and downloads directly from S3.

The `token` is the `key` value returned by `GET /api/files`.

**Response:** `302 Location: https://s3.amazonaws.com/...?X-Amz-Signature=...`

**Error responses:**
| Status | Condition |
|---|---|
| 400 | Invalid or malformed token |
| 404 | Object not found in S3 |

---

### `DELETE /api/files/:token`

Deletes the object from S3. Confirms object existence first (returns 404 if already gone).

**Response 200:**
```json
{ "message": "File deleted successfully." }
```

**Error responses:**
| Status | Condition |
|---|---|
| 400 | Invalid or malformed token |
| 404 | Object not found in S3 |
| 403 | IAM permissions insufficient |

---

## 6. How S3 Integration Works

### Bucket setup (manual — one time)

1. Go to **S3 → Create bucket**
2. Choose your region (must match `AWS_REGION`)
3. Enable **Block all public access** ✅
4. Leave all other settings as default
5. Copy the bucket name to `S3_BUCKET_NAME`

### Object key format

Every uploaded file is stored as:
```
uploads/<uuid>-<sanitised-original-filename>
```

Example: `uploads/f47ac10b-58cc-4372-a567-0e02b2c3d479-report_Q2.pdf`

- The UUID prevents filename collisions
- The original name is sanitised (no slashes, only safe characters)
- All objects share the `uploads/` prefix, making them easy to list/manage

### Presigned download URLs

When a download is requested:
1. Backend verifies the token decodes to a valid `uploads/` key
2. Backend checks the object exists (`HeadObject`)
3. Backend generates a presigned `GetObject` URL expiring in **15 minutes**
4. Backend returns HTTP 302 to the presigned URL
5. Browser downloads directly from S3 — the backend never streams the file

The S3 bucket has no public access. The presigned URL carries a time-limited cryptographic signature.

---

## 7. Security Considerations

| Area | Implementation |
|---|---|
| **AWS credentials** | Never in frontend code. Backend uses SDK credential chain. EC2 uses IAM role |
| **S3 bucket** | Private — block all public access enabled |
| **Download access** | 15-minute presigned URLs; each URL is single-purpose |
| **Key validation** | Every delete/download token is decoded and validated to start with `uploads/` |
| **Path traversal** | S3 key decoder rejects keys containing `..` |
| **File validation** | MIME type allowlist + 100 MB cap enforced before S3 is touched |
| **Upload concurrency** | Max 5 simultaneous uploads; 429 returned otherwise |
| **CORS** | Locked to `CORS_ORIGIN` env var — not wildcard |
| **Secrets in logs** | Server logs method + path only; no bodies, headers, or AWS responses |
| **Authentication** | Not implemented — add an auth layer (Cognito, JWT, etc.) before exposing publicly |

> ⚠️ **CloudDrop does not include user authentication.** Do not expose it publicly without adding an authentication and authorisation layer.

---

## 8. AWS EC2 Deployment

### Prerequisites

- Ubuntu 22.04 EC2 instance (t3.micro or larger)
- An IAM role attached to the EC2 instance with this policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket",
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:HeadObject"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

### Security group inbound rules

| Type | Port | Source |
|---|---|---|
| SSH | 22 | Your IP |
| HTTP | 80 | 0.0.0.0/0 |
| HTTPS | 443 | 0.0.0.0/0 |

### Step-by-step deployment

```bash
# ── 1. Connect to EC2 ────────────────────────────────────────────────────────
ssh -i your-key.pem ubuntu@<EC2-PUBLIC-IP>

# ── 2. Update system ─────────────────────────────────────────────────────────
sudo apt update && sudo apt upgrade -y

# ── 3. Install Node.js 20 ────────────────────────────────────────────────────
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x.x
npm --version    # 10.x.x

# ── 4. Install PM2 (process manager) ─────────────────────────────────────────
sudo npm install -g pm2

# ── 5. Install Nginx ─────────────────────────────────────────────────────────
sudo apt install -y nginx

# ── 6. Upload project (from your local machine) ──────────────────────────────
# Option A: git clone
git clone https://github.com/your-org/clouddrop.git /home/ubuntu/clouddrop

# Option B: scp
scp -r -i your-key.pem ./CloudDrop ubuntu@<EC2-PUBLIC-IP>:/home/ubuntu/clouddrop

cd /home/ubuntu/clouddrop

# ── 7. Configure server environment ──────────────────────────────────────────
cd server
cp .env.example .env
nano .env
# Set:
#   AWS_REGION=ap-south-1
#   S3_BUCKET_NAME=your-bucket-name
#   CORS_ORIGIN=http://<EC2-PUBLIC-IP>   (or your domain)
#   PORT=5000

npm install --omit=dev

# ── 8. Build the React frontend ───────────────────────────────────────────────
cd ../client
npm install
VITE_API_BASE_URL= npm run build
# Output: client/dist/

# ── 9. Configure Nginx ────────────────────────────────────────────────────────
sudo nano /etc/nginx/sites-available/clouddrop
```

Paste this Nginx config:

```nginx
server {
    listen 80;
    server_name _;   # replace with your domain if you have one

    root /home/ubuntu/clouddrop/client/dist;
    index index.html;

    # Serve React SPA — all non-API, non-asset routes fall back to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy all /api requests to the Node.js backend
    location /api {
        proxy_pass         http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;

        # Allow large uploads through Nginx
        client_max_body_size 110M;
        proxy_read_timeout   120s;
    }
}
```

```bash
# Enable and test Nginx
sudo ln -s /etc/nginx/sites-available/clouddrop /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# ── 10. Start backend with PM2 ────────────────────────────────────────────────
cd /home/ubuntu/clouddrop/server
pm2 start server.js --name clouddrop-server
pm2 save
pm2 startup   # follow the printed command to enable auto-start on reboot

# ── 11. Verify ────────────────────────────────────────────────────────────────
curl http://localhost:5000/api/health
curl http://<EC2-PUBLIC-IP>/api/health
```

Open `http://<EC2-PUBLIC-IP>` in your browser — you should see the CloudDrop dashboard.

### HTTPS with Let's Encrypt (recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
# Update CORS_ORIGIN in server/.env to https://yourdomain.com
pm2 restart clouddrop-server
```

---

## 9. Troubleshooting

### Backend won't start

```bash
# Check env vars are set
cat server/.env

# Check PM2 logs
pm2 logs clouddrop-server

# Test health endpoint directly
curl http://localhost:5000/api/health
```

### "AWS credentials could not be resolved"

- **EC2**: Verify an IAM role is attached → EC2 Console → Instance → Security → IAM Role
- **Local**: Run `aws sts get-caller-identity` to check credentials
- The IAM role needs: `s3:ListBucket`, `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:HeadObject`

### "S3 access denied" (403)

- Check the IAM policy includes the correct bucket ARN
- Ensure the bucket has **Block all public access** enabled (this does not affect IAM-authenticated access)
- Verify `S3_BUCKET_NAME` exactly matches the bucket name (case-sensitive)

### File upload fails at the browser

- Check the browser Network tab for the exact error response
- Verify Nginx `client_max_body_size` is set to at least `110M`
- Check `pm2 logs clouddrop-server` for the server-side error

### React app shows "Failed to load files" on first open

- The backend is not reachable. Check:
  - **Dev**: Is `npm run dev` running in the `server/` directory?
  - **Prod**: Is `pm2 status` showing `online`? Is Nginx proxying `/api` correctly?

### Nginx 502 Bad Gateway

```bash
# Check backend is running
pm2 status

# Check backend port matches Nginx proxy_pass
grep PORT server/.env          # should be 5000
grep proxy_pass /etc/nginx/sites-available/clouddrop   # should be :5000

# Restart both
pm2 restart clouddrop-server
sudo systemctl reload nginx
```

### Presigned download URL expired

Presigned URLs are valid for **15 minutes**. If the link was generated longer ago than that, click the download button again to generate a fresh URL.

---

## License

MIT
