# VSS — Virtual Student Space

> **The student resource space for KL University (KLEF)**  
> Production deployment: [https://klu-vss.vercel.app](https://klu-vss.vercel.app)

VSS is a peer-to-peer collegiate academic sharing platform built for KL University students. It enables verified students to share authentic lecture notes, lab records, previous year exam solutions, and project repositories.

---

## 🏛️ System Architecture & Directory Layout

```
vss75-deploy/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions CI for automated build & typecheck
├── public/
│   ├── images/                # Logos and static visual assets
│   ├── samples/               # Static academic sample files (PDF, Java, Python, Verilog)
│   └── pdf.worker.min.js      # PDF.js worker for client-side rendering
├── scripts/
│   ├── README.md              # Documentation for repository scripts
│   ├── generate_all_authentic_pdfs.js  # Utility to generate multi-page course PDFs
│   └── sync_all_to_r2.js      # Utility to sync local samples to Cloudflare R2
├── src/
│   ├── app/                   # Next.js 16 App Router pages & server routes
│   │   ├── (routes)/          # Frontend pages (/notes, /explore, /upload, /dashboard, etc.)
│   │   └── api/
│   │       ├── auth/          # ERP authentication & session endpoints
│   │       └── r2/            # Cloudflare R2 object storage integration
│   │           ├── upload/    # Presigned upload & multipart streaming route
│   │           ├── download/  # Byte-for-byte original PDF delivery (presigned / proxy)
│   │           └── health/    # R2 configuration & status health check
│   ├── components/
│   │   ├── auth/              # Campus ERP & student verification modals
│   │   ├── common/            # Shared badges, avatars, and verified indicators
│   │   ├── layout/            # Navbar, footer, and shell navigation
│   │   ├── requests/          # Discussion threads, request forms, and offer modals
│   │   ├── resources/         # Resource cards, preview modal, and comments section
│   │   └── ui/                # Toast notifications and base primitives
│   ├── lib/
│   │   ├── context/           # AppContext (global user state, toast, modal controls)
│   │   ├── data/              # Official KLU course lists (klu-courses.ts, sample-data.ts)
│   │   ├── erp/               # KL University ERP scraper and session validator
│   │   └── storage/
│   │       ├── file-storage.ts# Client-side IndexedDB binary blob caching
│   │       └── mock-store.ts  # Client storage layer (vss_*_v4 keys & events)
│   └── types/
│       └── index.ts           # Shared TypeScript interfaces (Resource, UserProfile, etc.)
├── .env.example               # Environment variables template
├── next.config.mjs            # Next.js configuration (Turbopack optimization)
├── tailwind.config.ts         # Tailwind CSS styling configuration
└── tsconfig.json              # TypeScript strict configuration
```

---

## ⚙️ Core Modules & Workflows

### 1. File Storage & Cloudflare R2 Object Delivery
Uploaded coursework files and notes are stored permanently in a Cloudflare R2 bucket (`klu-vss-files`) using the AWS S3 SDK.
- **Upload Flow (`/api/r2/upload`)**:
  - Small files (< 4.5 MB) are streamed directly to R2 via server route.
  - Large files (> 4.5 MB) receive a presigned S3 PUT URL for direct browser-to-bucket upload.
  - Supports authenticated ERP student sessions and client-authenticated requests (`x-vss-author-id`).
- **Download Flow (`/api/r2/download`)**:
  - Delivers byte-for-byte identical source PDFs directly from R2.
  - Issues short-lived presigned 307 Temporary Redirects for mobile Safari optimization.
  - Supports fallback proxy streaming (`?proxy=true`) and client-cached IndexedDB binary delivery.
- **Health Check (`/api/r2/health`)**:
  - Returns `200 OK` JSON with bucket status and configuration flags.

### 2. Client Storage & Versioning
- Local browser state uses namespaced keys versioned as `vss_*_v4` in [mock-store.ts](file:///C:/Users/LOHITH/Documents/vss75-deploy/src/lib/storage/mock-store.ts).
- `MockStorageManager.removeLegacyDemoData()` automatically purges legacy unversioned or older keys from `localStorage` and cleans the local IndexedDB database.
- State updates dispatch custom DOM events (`klu_resources_change`, `klu_requests_change`, `klu_auth_change`) for real-time reactivity across components.

### 3. Authentication
- **KL University ERP Session**: Authenticates against official campus ERP portal endpoints via [src/lib/erp/](src/lib/erp) with live CAPTCHA challenges and student credentials.
- **Security & Privacy**: Passwords are never stored on VSS servers or local storage. Rate limiting and access audit trails are enforced.

---

## 🧭 Engineering Workflow & Contributor Guide

For architectural rules, pre-commit checklists, and contributor guidelines, refer to **[WORKFLOW.md](WORKFLOW.md)**.


## 🚀 Environment Variables

Copy `.env.example` to `.env` or configure in your deployment platform:

```ini
# Cloudflare R2 Object Storage Configuration
CLOUDFLARE_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=klu-vss-files

# Optional: Public R2 Custom Domain
R2_PUBLIC_DOMAIN=

# Campus Configuration
NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN=kluniversity.in
NEXT_PUBLIC_APP_URL=https://klu-vss.vercel.app
```

---

## 🛠️ Development & Build Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run TypeScript check and production build
npm run build

# Start production server
npm run start
```

---

## 📦 Deployment

- **Hosting**: Vercel (Auto-deployed on push to `main` branch).
- **Git Commit Author**: Commits must use author `Deepthanush1337 <deepthanush3301@icloud.com>` to trigger builds on the linked Vercel team account.
