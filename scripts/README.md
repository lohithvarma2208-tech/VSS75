# Maintenance & Sync Scripts

This directory contains standalone utility scripts for repository operations and Cloudflare R2 bucket management.

## Available Scripts

### 1. `generate_all_authentic_pdfs.js`
Generates multi-page academic PDF files with standard PDF/A structure for core curriculum courses:
- DSA Module 3 Arrays & Strings (26SC1203)
- Discrete Mathematics Units 2 & 3 (23MT2001)
- DBMS End-Sem Question Bank (23CS3106)
- Wireshark TCP Packet Analysis (23CS3309)
- AVL Trees Lab Record (23CS2101)
- DTIE Stanford 5-Stage Portfolio (26UC1137)

Run via:
```bash
node scripts/generate_all_authentic_pdfs.js
```

### 2. `sync_all_to_r2.js`
Synchronizes generated sample files from `public/samples` to the Cloudflare R2 object storage bucket (`klu-vss-files`) using AWS S3 SDK credentials configured in `.env`.

Run via:
```bash
node scripts/sync_all_to_r2.js
```
