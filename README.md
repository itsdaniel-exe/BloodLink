<div align="center">

# 🩸 BloodLink

**An ML-powered emergency blood donation & donor alert platform**

Predicts who's most likely to respond to a blood request, and reaches them first — smart donor
matching, real push alerts, and a full hospital ops console, running entirely on free tiers.

[**→ Live demo**](https://bloodlink-18246.web.app)

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?logo=cloudflare&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-API-E36002?logo=hono&logoColor=white)
![D1](https://img.shields.io/badge/D1-SQLite-F38020?logo=cloudflare&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%2B%20FCM-FFCA28?logo=firebase&logoColor=black)

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
- 👤 **Donor Portal** — every donor gets a personal link to track alerts and confirm availability, recoverable by phone number
- 🔐 **Staff Authentication** — Firebase-secured login gates the hospital console; donor registration stays open to the public
- 📍 **Geo-aware Matching** — Haversine-distance proximity scoring ranks donors by closeness to the requesting hospital

## Try it

[**bloodlink-18246.web.app**](https://bloodlink-18246.web.app)
