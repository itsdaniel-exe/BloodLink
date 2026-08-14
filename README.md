<div align="center">

# 🩸 BloodLink

**An ML-powered emergency blood donation & donor alert platform**

Predicts who's most likely to respond to a blood request — and reaches them first.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white&style=flat-square)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white&style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white&style=flat-square)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20FCM-FFCA28?logo=firebase&logoColor=black&style=flat-square)
![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss&logoColor=white&style=flat-square)

</div>

---

## What it does

When a hospital logs an emergency blood request, BloodLink doesn't just broadcast to every
donor in the system. It scores each eligible donor's probability of responding — using donation
history, past response behavior, proximity, and blood-group rarity — and sends targeted alerts
to the donors most likely to actually show up. The result: faster response times, fewer
irrelevant notifications, and a system that gets smarter about who to reach.

## ✨ Features

- 🧠 **AI Donor Scoring** — a logistic regression model (sigmoid, 6 engineered features, trained
  weight vector) predicts each donor's response probability in real time
- 💬 **GenAI-style Assistant** — a RAG-pattern chatbot answers natural-language questions about
  donor stats, blood availability, and request urgency, grounded entirely in live data
- 📊 **Command Hub Dashboard** — blood group distribution, urgency breakdown, donor response
  rate, and live infrastructure status at a glance
- 🏆 **Gamification & Leaderboard** — donors earn points and badges (Bronze → Platinum) for
  donation history and alert responsiveness
- 📈 **Demand Forecasting** — projected blood-unit needs per group with trend indicators
- 🏥 **Hospital Ops Console** — create emergency requests, manage per-hospital blood inventory,
  and trigger real-time donor matching + alerts
- 🔔 **Real Push Notifications** — Firebase Cloud Messaging delivers live alerts to donors'
  browsers, not just a mock log
- 🔐 **Staff Authentication** — Firebase-secured login gates the hospital console; donor
  registration stays open to the public
- 📍 **Geo-aware Matching** — Haversine-distance proximity scoring ranks donors by how close
  they are to the requesting hospital

## 🛠️ Tech Stack

| Layer | Stack |
|---|---|
| Frontend | React 18 · Vite · React Router · Tailwind CSS · Recharts |
| Backend | Node.js · Express |
| Auth & Notifications | Firebase Authentication · Firebase Cloud Messaging |
| Machine Learning | Custom logistic regression classifier (pure JavaScript) |
| Data | JSON-based persistence layer |

## 🚀 Quick Start

```bash
npm run install:all
npm run dev
```

Open **http://localhost:5173** — the app runs fully functional out of the box.

---

<div align="center">
<sub>Built as a demonstration of applying machine learning to real-time emergency response systems.</sub>
</div>
