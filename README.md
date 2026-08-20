# 📖 KhataBook - Digital Credit Purchase Ledger

A modern, fast, and responsive digital credit ledger web application built with **React**, **Vite**, and **Firebase Cloud Firestore**. Designed for small businesses, shops, and merchants to track credit purchases, itemized customer transactions, and payment settlements in real-time across all devices.

---

## ✨ Features

- **⚡ Unified Credit & Customer Creation**:
  - Automatically matches existing customers or seamlessly creates new customer profiles on-the-fly when recording a credit purchase.
- **📦 Multi-Item Purchases**:
  - Itemized bills with quantity, unit prices, and automatic total calculations.
- **💳 Bill-by-Bill & Account-Level Settlements**:
  - Dedicated payment recording directly attached to specific credit purchase bills or auto-settled against oldest dues.
  - Live status badges (*Paid in Full*, *Partially Paid*, *Unpaid*).
- **☁️ Real-time Firebase Cloud Sync**:
  - Powered by **Firebase Firestore** with live snapshot listeners for multi-device sync.
  - **Offline-First**: Changes mirror to LocalStorage with automatic cloud synchronization when online.
- **📱 Mobile-First & Cross-Device Ergonomics**:
  - Single-screen mobile drill-down navigation.
  - Bottom-sheet touch modals and compact layouts.
  - 1-tap direct call (`tel:`) and WhatsApp payment reminder generator.
- **🌓 Dark & Light Modes**:
  - Sleek, tailored color palettes with instant theme toggle.
- **💾 Data Safety & Backups**:
  - Offline JSON backup export & restore.
  - One-click cloud synchronization.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vanilla CSS (Design Tokens & Glassmorphism)
- **Bundler & Dev Server**: Vite
- **Icons**: Lucide React
- **Cloud Database**: Google Firebase Firestore
- **State & Storage**: React State + LocalStorage Mirroring

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <your-github-repo-url>
   cd "khata book"
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Build for Production**:
   ```bash
   npm run build
   ```

---

## ☁️ Firebase Configuration

Firebase Firestore is configured in `src/services/firebase.js`. To use your own Firebase project:
1. Create a project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firestore Database** in test or production mode.
3. Update the `firebaseConfig` object in `src/services/firebase.js` with your credentials.

---

## 📄 License
MIT License. Free for commercial and personal use.
