# SoulMagle – AI-Powered Video Chat App 🎥💬🚀 
SoulMagle is an intelligent, real-time video chat application that enhances user connections using AI-powered interest-based matching. It integrates WebRTC for seamless video/audio calls, Socket.io for real-time messaging, and AI embeddings for smart user recommendations.

SoulMagle is an AI-enhanced video chat platform designed to connect users with similar interests using **AI-powered user matching**. The app integrates **LLM models (Gemini AI for testing)** and **pgvector** for intelligent user searches based on interest embeddings.

## ✨ Features
- **🔍 AI-Powered User Matching** – Finds users with shared interests using vector embeddings and similarity search.
- **📹 Real-Time Video Chat** – High-quality, low-latency video communication.
- **💬 Instant Messaging** – Send and receive messages in real time.
- **🧠 Integrated AI (Gemini AI for Testing)** – Provides intelligent insights into user connections.

## 🚀 Technologies Used
- **Backend**: Node.js, Express.js, PostgreSQL, Socket.io
- **Database**: PostgreSQL with **pgvector** for similarity search
- **AI Integration**: Gemini AI (for testing), Hugging Face models - *all-miniLm-L6-v2* for embeddings via **@xenova/transformers**
- **Frontend**: React.js, WebRTC for video chat

## 📌 Installation & Setup
```sh
git clone https://github.com/ravikushwah0011/SoulMagle.git
cd SoulMagle

npm install
```

### Start the Server
```sh
npm start server
```

### Start the Client
```sh
npm run start
```

## 🎯 Future Improvements
- **Enhanced AI Matching**: Fine-tune AI recommendations.
- **More LLM Integrations**: Expand to more advanced AI models.
- **Optimized Performance**: Improve connection stability and user experience.
- **🔄 Persistent Socket Connection** – Ensures uninterrupted chats even after page reloads.

### 💡 Contribute & Support
Pull requests and feedback are welcome! Feel free to fork and contribute. Let's make SoulMagle even better! 🚀

