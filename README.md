# VSS75 — Virtual Student Space (Campus Academic Knowledge Network)

> **VSS75 MISSION**: Transforming scattered, ephemeral coursework into a permanent, discoverable, collegiate knowledge repository for KL University students.

**Virtual Student Space (VSS)** is a student academic resource-sharing platform built primarily for students of **KL University (KLU), India**.

It transforms scattered, ephemeral coursework—previously lost across WhatsApp groups, Telegram chats, and private drives—into a permanent, discoverable, collegiate knowledge repository.

---

## 🏛️ Product Overview & Architecture

### The Peer Learning Cycle
```
STUDENT CREATES ➔ STUDENT SHARES ➔ OTHERS LEARN ➔ OTHERS IMPROVE ➔ OTHERS CONTRIBUTE
```

Virtual Student Space is designed specifically for peer academic reference, conceptual analysis, and research collaboration.

### Supported Academic Categories:
1. **Assignments & Problem Sets**
2. **Programming Repositories & Algorithmic Solutions**
3. **Lab Records & Formatted Observations**
4. **Lab Experiments & Procedures**
5. **Mini Projects**
6. **Major Projects (Capstone)**
7. **DTIE Projects (Design Thinking & Innovation in Engineering)**
8. **Mathematics & Graph Theory Guides**
9. **Handwritten Lecture & Unit Notes**
10. **Presentations & Defense Slide Decks**
11. **Technical Reports & Case Studies**
12. **Study Resources & Previous Year Exam Questions (PYQs)**
13. **Other Academic Toolchains & Guides**

---

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (Strict typing)
- **Styling**: Tailwind CSS with custom university collegiate theme & `Plus Jakarta Sans` + `JetBrains Mono` fonts
- **Background Video Engine**: Multi-theme ambient video background with "The Vault of Knowledge" 10s Full HD loop
- **Icons**: Lucide Icons
- **PDF Suite**: PDF Studio Pro with multi-page annotation, handwritten signatures, whiteout redaction, and PDF merging/splitting
- **Database / Backend Integration**: PostgreSQL / Supabase ready (`supabase/migrations/` and `seed.sql` included)
- **State & Local Offline Engine**: Dynamic hybrid store with reactive browser persistence and instant demo mode
- **Form Validation**: Zod & custom validation guards

---

## 📁 Project Directory Structure

```
C:\Users\LOHITH\Documents\VSS75/
├── .env.example              # Environment variables template
├── .env.local                # Local environment setup
├── package.json              # Project dependencies & scripts
├── tsconfig.json             # TypeScript compiler configuration
├── tailwind.config.ts        # Tailwind configuration & theme
├── postcss.config.mjs        # PostCSS configuration
├── next.config.mjs           # Next.js configuration
├── public/
│   ├── samples/              # Sample downloadable coursework files
│   ├── images/               # Key visuals & static hero graphics
│   └── videos/               # Ambient looping videos including "The Vault of Knowledge"
├── supabase/
│   ├── migrations/
│   │   ├── 20240101000000_init_schema.sql       # Full PostgreSQL DDL + RLS Policies
│   │   └── 20240102000000_resource_requests.sql  # Coursework requests & offers schema
│   └── seed.sql              # Rich sample data for KLU courses & categories
└── src/
    ├── app/
    │   ├── layout.tsx        # Root layout with AppProvider, Navbar & Footer
    │   ├── page.tsx          # Landing page (Hero, Categories, Cycle, Trending)
    │   ├── explore/          # Search, category filters, course & semester sorting
    │   ├── resource/[id]/    # Dedicated resource page, preview, download, comments
    │   ├── requests/         # Academic bounty board & resource request system
    │   ├── leaderboard/      # Academic Heads Leaderboard & top contributors
    │   ├── pdf-studio/       # PDF Studio Pro document workspace
    │   ├── upload/           # Drag-and-drop file upload with validation
    │   ├── projects/         # Capstone, DTIE, Mini, and Hackathon showcase
    │   ├── notes/            # Module-wise handwritten notes & study resources
    │   ├── dashboard/        # Student dashboard with analytics & user uploads
    │   ├── profile/[user]/   # Public student profile with editable bio
    │   ├── saved/            # Bookmarks & saved resources hub
    │   ├── admin/            # Protected moderation desk & report audit queue
    │   └── auth/             # Login & Registration with ERP verification
    ├── components/
    │   ├── layout/           # Navbar, Footer
    │   ├── common/           # AmbientBackgroundLayer, BackgroundVideo, VideoThemeSwitcher
    │   ├── pdf-studio/       # Canvas, Exporter, Toolbars, Signature modal
    │   ├── requests/         # Bounty cards, discussion, offer modals
    │   ├── resources/        # ResourceCard, PreviewModal, ReportModal, Comments
    │   └── ui/               # Badge, Toast
    ├── lib/
    │   ├── context/          # AppContext & reactive state
    │   ├── data/             # Sample KLU courses & realistic demo dataset
    │   ├── storage/          # Mock storage engine (offline fallback + storage)
    │   ├── supabase/         # Supabase client & server connectors
    │   ├── validation/       # Zod upload schemas
    │   └── utils.ts          # Utility functions
    └── types/
        └── index.ts          # Comprehensive TypeScript interface definitions
```

---

## ⚡ Running the Application Locally

```bash
cd C:\Users\LOHITH\Documents\VSS75
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.
