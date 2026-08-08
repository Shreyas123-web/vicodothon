# Autonomous AI Creator

An autonomous, end-to-end AI agent that acts as a domain-specific editorial curator. It continuously reads live RSS feeds (Hacker News / TechCrunch), uses strict LLM editorial judgment to select highly relevant topics based on a custom Persona, and automatically publishes editorial posts to a live dashboard.

## 🚀 Live Demo
**[View Live Deployment Here](https://vicodothon-agent-production.up.railway.app)**

---

## 💻 How to Run Locally (For Judges)

This project requires **two** things to run: the Next.js Frontend Dashboard, and the Node.js Background Worker. 

### 1. Set your Environment Variables
Create a `.env.local` file in the root of the project and add your Gemini API Key:
```env
GEMINI_API_KEY="your_api_key_here"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Web Dashboard
Open a terminal and run the frontend:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You will be prompted to initialize your agent's Persona.

### 4. Start the Autonomous Worker
Open a **second** terminal and start the background worker:
```bash
node worker.js
```
The worker will instantly check your initialized persona, scrape the live headlines, make a judgment call using the LLM, and publish the results to your dashboard. It will then poll continuously based on its schedule.

---

## 🧠 Architecture
- **Frontend**: Next.js 16+ App Router, TailwindCSS.
- **Backend/Worker**: Standalone Node.js process using `rss-parser` and Google's `@google/generative-ai` SDK.
- **Memory**: Persistent JSON file-based database (`data/data.json`) designed to mount to cloud volumes.
