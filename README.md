# AIS Captive Portal & Voucher Management System

A web-based captive portal and voucher authentication system designed for Annafunan Integrated School, integrated with MikroTik RouterOS.

## Features
- Captive network detection (Android, iOS/macOS, Windows NCSI probe handling)
- Voucher authentication with bandwidth and time-limit enforcement
- Admin dashboard for bulk voucher generation, session monitoring, and device disconnects
- Direct synchronization scripts (`.rsc`) for MikroTik Hotspot User Manager

## Tech Stack
- **Frontend:** React, Tailwind CSS, Lucide Icons, Vite
- **Backend:** Node.js, Express, TypeScript (`tsx`)
- **Networking Target:** MikroTik RouterOS (Hotspot / RADIUS)

## Installation & Setup

1. Install dependencies:
   ```bash
   npm install