# 🤖 AI Code Review Tool

**Live Demo:** [ai-code-review-aqgk.vercel.app](https://ai-code-review-aqgk.vercel.app)

An AI-powered code review tool that analyzes your code for bugs, security issues, performance problems and suggests improvements — built with **Java Spring Boot** and **React**.

![AI Code Review](https://img.shields.io/badge/Java-Spring%20Boot-green) ![React](https://img.shields.io/badge/Frontend-React-blue) ![Groq](https://img.shields.io/badge/AI-Groq%20LLM-orange)

## ✨ Features

- 🔍 **AI Code Review** — detects bugs, security issues, performance problems
- 📊 **Quality Score** — rates your code from 0-100
- 🌈 **Syntax Highlighting** — supports 10 languages
- 🎯 **Line Highlighting** — click an issue to jump to that line
- ▶️ **Code Execution** — run your code and see output instantly
- 💡 **Improved Code** — AI suggests a better version of your code

## 🛠 Tech Stack

- **Backend** — Java 17, Spring Boot 3, REST API, Maven
- **Frontend** — React, Vite, CodeMirror
- **AI** — Groq LLM (llama-3.3-70b)

## 🚀 Supported Languages

JavaScript, TypeScript, Python, Java, C++, Rust, Go, SQL, HTML, CSS

## 📸 Demo

Paste any code → Select language → Click Review → Get instant AI feedback

## ⚙️ Setup

### Backend
```bash
# Set your Groq API key at https://console.groq.com
mvn spring-boot:run -f backend/pom.xml
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**
