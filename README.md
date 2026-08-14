<div align="center">

# 🩸 BloodLink

**An ML-powered emergency blood donation & donor alert platform**

Predicts who's most likely to respond to a blood request, and reaches them first — smart donor
matching, real push alerts, and a full hospital ops console, all on a free, self-hostable stack.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20FCM-FFCA28?logo=firebase&logoColor=black)
![Recharts](https://img.shields.io/badge/Recharts-Data%20Viz-FF6384?logo=chartdotjs&logoColor=white)

</div>

---

## What it does

- 🧠 **AI Donor Scoring** — a logistic regression model (sigmoid, 6 engineered features) predicts each donor's response probability in real time
- 💬 **GenAI-style Assistant** — a RAG-pattern chatbot answers natural-language questions about donor stats and request urgency, grounded entirely in live data
- 📊 **Command Hub Dashboard** — blood group distribution, urgency breakdown, and donor response rate at a glance
- 🏆 **Gamification & Leaderboard** — donors earn points and badges from Bronze to Platinum
- 📈 **Demand Forecasting** — projected blood-unit needs per group with trend indicators
- 🏥 **Hospital Ops Console** — create emergency requests, manage inventory, and trigger real-time donor matching + alerts
- 🔔 **Real Push Notifications** — Firebase Cloud Messaging delivers live alerts to donors' browsers, not just a mock log
- 🔐 **Staff Authentication** — Firebase-secured login gates the hospital console; donor registration stays open to the public
- 📍 **Geo-aware Matching** — Haversine-distance proximity scoring ranks donors by closeness to the requesting hospital


---

<div align="center">
<sub>Built as a demonstration of applying machine learning to real-time emergency response systems.</sub>
</div>
