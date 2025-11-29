# CollabAI 🤝🤖

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

**CollabAI** is a modern, real-time video collaboration platform powered by **WebRTC**, **AI**, and a robust **Node.js** backend. It provides seamless video conferencing, AI-powered meeting summaries, and action item extraction, all while maintaining a strong focus on **GDPR compliance** and user data privacy.

---

## 🎥 Watch Demo

[![CollabAI Demo](https://img.youtube.com/vi/ve-Ug5Szzmg/maxresdefault.jpg)](https://youtu.be/ve-Ug5Szzmg)

> Click the image above to watch the demo video.

---

## ✨ Key Features

- **📹 Real-time Video Collaboration**
  High-quality, multi-user video conferencing powered by **WebRTC**, featuring camera/mic controls and screen sharing.

- **🤖 AI-Powered Insights**
  Automatically generate meeting **transcriptions**, **summaries**, and **action items** using Google's Gemini API.

- **🛡️ Comprehensive GDPR Compliance**
  Built from the ground up with privacy in mind, featuring a user-facing privacy dashboard, granular consent management, and full data export/deletion capabilities.

- **👤 User & Session Management**
  Secure authentication using **NextAuth.js** with email/password and OAuth (Google) providers.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Node.js, Express.js |
| **Real-time** | WebRTC, Socket.IO |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Google Gemini API (1.5-flash model) |
| **Auth** | NextAuth.js, Supabase Auth |

---

## 🚀 Deployment & Infrastructure

The application is designed for scalability and reliability with a modern deployment strategy.

- **Frontend (Vercel)**: The Next.js frontend is deployed on **Vercel**, leveraging its Edge Network for global low-latency content delivery.
- **Backend (Render)**: The Node.js backend server is deployed on **Render**. It's configured to be stateless, allowing for horizontal scaling.
- **Database (Supabase)**: The **Supabase** PostgreSQL instance provides a scalable database backend with connection pooling.
- **WebRTC Infrastructure**: Utilizes multiple **STUN servers** to ensure reliable peer-to-peer connection establishment.

---

## ⚙️ Core System Explanations

### WebRTC Implementation
CollabAI's video conferencing is built on a peer-to-peer **WebRTC** architecture.
1.  **Signaling**: A **Node.js + Socket.IO** server acts as the signaling layer.
2.  **Peer Connection**: Clients establish a direct peer-to-peer connection.
3.  **NAT Traversal**: We use multiple **STUN servers**.
4.  **Media Streams**: The browser's `getUserMedia` API captures audio and video.

### AI Integration (Gemini API)
Our AI features are powered by Google's **`gemini-1.5-flash`** model.
- **Service Layer**: A dedicated `GeminiService.ts` handles API interactions.
- **Functionality**: Processes meeting transcripts to generate summaries and action items.
- **Optimization**: Uses engineered prompts and client-side caching.

### GDPR Compliance
Compliance is a core feature.
- **Consent Management**: Granular consent system.
- **Data Protection**: Encryption at rest and in transit.
- **User Rights**: Dedicated Privacy Dashboard (Article 15, 17, 20).
- **Audit Logging**: Comprehensive logs of data processing.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18.x or later)
- npm, yarn, or pnpm
- Git

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/collab-ai.git
    cd collab-ai
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the root of the project and add your credentials.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to fork the repository, make your changes, and submit a pull request.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` file for more information.
