

# CollabAI 🤝🤖

CollabAI is a modern, real-time video collaboration platform powered by **WebRTC**, **AI**, and a robust **Node.js** backend. It provides seamless video conferencing, AI-powered meeting summaries, and action item extraction, all while maintaining a strong focus on **GDPR compliance** and user data privacy.

-----

## 📋 Table of Contents

  - [✨ Key Features](https://www.google.com/search?q=%23-key-features)
  - [🛠️ Tech Stack](https://www.google.com/search?q=%23%EF%B8%8F-tech-stack)
  - [🚀 Deployment & Infrastructure](https://www.google.com/search?q=%23-deployment--infrastructure)
  - [⚙️ Core System Explanations](https://www.google.com/search?q=%23%EF%B8%8F-core-system-explanations)
      - [WebRTC Implementation](https://www.google.com/search?q=%23webrtc-implementation)
      - [AI Integration (Gemini API)](https://www.google.com/search?q=%23ai-integration-gemini-api)
      - [GDPR Compliance](https://www.google.com/search?q=%23gdpr-compliance)
  - [🧠 Development Challenges & Solutions](https://www.google.com/search?q=%23-development-challenges--solutions)
  - [🚀 Getting Started](https://www.google.com/search?q=%23-getting-started)
  - [🤝 Contributing](https://www.google.com/search?q=%23-contributing)
  - [📄 License](https://www.google.com/search?q=%23-license)

-----

## ✨ Key Features

  * **📹 Real-time Video Collaboration:** High-quality, multi-user video conferencing powered by **WebRTC**, featuring camera/mic controls and screen sharing.
  * **🤖 AI-Powered Insights:** Automatically generate meeting **transcriptions**, **summaries**, and **action items** using Google's Gemini API.
  * **🛡️ Comprehensive GDPR Compliance:** Built from the ground up with privacy in mind, featuring a user-facing privacy dashboard, granular consent management, and full data export/deletion capabilities.
  * **👤 User & Session Management:** Secure authentication using **NextAuth.js** with email/password and OAuth (Google) providers.

-----

## 🛠️ Tech Stack

| Category                 | Technology                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------- |
| **Frontend** | Next.js, React, TypeScript, Tailwind CSS, shadcn/ui                                |
| **Backend** | Node.js, Express.js                                                                |
| **Real-time Comms** | WebRTC, Socket.IO                                                                  |
| **Database & Storage** | Supabase (PostgreSQL)                                                              |
| **AI Integration** | Google Gemini API (1.5-flash model)                                                |
| **Authentication** | NextAuth.js, Supabase Auth                                                         |

-----

## 🚀 Deployment & Infrastructure

The application is designed for scalability and reliability with a modern deployment strategy.

  * **Frontend (Vercel):** The Next.js frontend is deployed on **Vercel**, leveraging its Edge Network for global low-latency content delivery. Deployment is continuous from the `main` GitHub branch.
  * **Backend (Render):** The Node.js backend server is deployed on **Render**. It's configured to be stateless, allowing for horizontal scaling as needed.
  * **Database (Supabase):** The **Supabase** PostgreSQL instance provides a scalable database backend with connection pooling and global edge locations to ensure fast data access.
  * **WebRTC Infrastructure:** Utilizes multiple **STUN servers** to ensure reliable peer-to-peer connection establishment across different network environments (NAT traversal).

-----

## ⚙️ Core System Explanations

### WebRTC Implementation

CollabAI's video conferencing is built on a peer-to-peer **WebRTC** architecture, which minimizes server load and provides low-latency communication.

1.  **Signaling:** A **Node.js + Socket.IO** server acts as the signaling layer. It manages room creation and exchanges connection metadata (ICE candidates and SDP offers/answers) between peers to help them find and connect to each other.
2.  **Peer Connection:** Once signaling is complete, clients establish a direct peer-to-peer connection.
3.  **NAT Traversal:** We use multiple **STUN servers** to help peers discover their public IP addresses and navigate through firewalls and NATs.
4.  **Media Streams:** The browser's `getUserMedia` API captures audio and video, which is then streamed directly to other peers in the call.

### AI Integration (Gemini API)

Our AI features are powered by Google's **`gemini-1.5-flash`** model, chosen for its speed and effectiveness.

  - **Service Layer:** A dedicated `GeminiService.ts` on the backend handles all interactions with the API.
  - **Functionality:** The service processes meeting transcripts to generate concise summaries and extract key action items.
  - **Prompt Engineering:** We use carefully engineered prompts to ensure the AI returns high-quality, structured data while minimizing token usage. Client-side caching is used to reduce redundant API calls.

### GDPR Compliance

Compliance is a core feature, not an afterthought. Our implementation includes:

  - **Consent Management:** A granular consent system tracks user preferences for different data processing activities.
  - **Data Protection:** All sensitive data is encrypted at rest and in transit. We enforce database security using **Supabase's Row-Level Security (RLS)** policies.
  - **User Rights:** A dedicated **Privacy Dashboard** allows users to exercise their rights, including viewing their data (Article 15), requesting deletion (Article 17), and exporting their data (Article 20).
  - **Audit Logging:** Comprehensive logs of data processing activities are maintained for transparency and verification.

-----

## 🧠 Development Challenges & Solutions

  * **Challenge: WebRTC Connectivity**

      * **Solution:** We enhanced connection reliability by implementing multiple STUN servers, optimizing the ICE candidate exchange process, and adding robust reconnection logic.

  * **Challenge: GDPR Complexity**

      * **Solution:** We built a modular compliance system, separating concerns like consent, data encryption, and user rights management. This made the complex requirements manageable and easier to maintain.

  * **Challenge: AI Performance & Cost**

      * **Solution:** We optimized prompts for the Gemini API to improve response quality and reduce token usage. We also implemented caching for AI-generated content to minimize redundant API calls.

-----

## 🚀 Getting Started

To get a local copy up and running, follow these steps.

### Prerequisites

  * Node.js (v18.x or later)
  * npm, yarn, or pnpm
  * Git

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

    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

    # NextAuth
    NEXTAUTH_URL=http://localhost:3000
    NEXTAUTH_SECRET=YOUR_SUPER_SECRET_KEY

    # Google OAuth
    GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
    GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

    # AI Provider
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to view the application.

-----

## 🤝 Contributing

Contributions are welcome\! Please feel free to fork the repository, make your changes, and submit a pull request. For major changes, please open an issue first to discuss what you would like to change.

-----

## 📄 License

Distributed under the MIT License. See `LICENSE` file for more information.
