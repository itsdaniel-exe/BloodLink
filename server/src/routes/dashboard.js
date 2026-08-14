import { Router } from "express";
import { db } from "../db.js";
import { BLOOD_GROUPS, isEligible } from "../utils.js";
import { scoringDirectory } from "../ml.js";
import { firebaseEnabled } from "../firebaseAdmin.js";

export const dashboardRouter = Router();

// Illustrative demand-forecast heuristic (recent request velocity per blood group) - a
// static, clearly-labelled projection derived from the seeded request mix rather than a
// trained forecasting model (there isn't nearly enough historical data for one here).
const DEMAND_FORECAST = [
  { bloodGroup: "O+", trend: 15, projectedUnits: 45, priority: "HIGH" },
  { bloodGroup: "A+", trend: 5, projectedUnits: 30, priority: "MEDIUM" },
  { bloodGroup: "B+", trend: -2, projectedUnits: 25, priority: "LOW" },
  { bloodGroup: "AB+", trend: 0, projectedUnits: 10, priority: "LOW" },
  { bloodGroup: "O-", trend: 25, projectedUnits: 20, priority: "CRITICAL" },
  { bloodGroup: "A-", trend: 10, projectedUnits: 15, priority: "MEDIUM" },
];

function badgeFor(points) {
  if (points >= 1500) return "Platinum";
  if (points >= 700) return "Gold";
  if (points >= 300) return "Silver";
  return "Bronze";
}

dashboardRouter.get("/", (req, res) => {
  const { donors, requests, hospitals, alerts, responses } = db.get();
  const eligible = donors.filter(isEligible);
  const active = requests.filter((r) => r.status === "ACTIVE");
  const confirmedResponses = responses.filter((r) => r.status === "CONFIRMED").length;
  const totalAlertsReceived = donors.reduce((s, d) => s + (d.alertsReceived || 0), 0);
  const totalAlertsResponded = donors.reduce((s, d) => s + (d.alertsResponded || 0), 0);
  const alertsSent = alerts.length + totalAlertsReceived;
  const responseRate = alertsSent
    ? (((responses.length ? confirmedResponses : 0) + totalAlertsResponded) / alertsSent) * 100
    : 0;

  const bloodGroupDistribution = BLOOD_GROUPS.map((g) => ({
    bloodGroup: g,
    donors: donors.filter((d) => d.bloodGroup === g).length,
  }));

  const urgencyBreakdown = ["CRITICAL", "HIGH", "MEDIUM", "LOW"].map((u) => ({
    urgency: u,
    count: requests.filter((r) => r.urgency === u).length,
  }));

  const infrastructure = [
    { category: "DATABASE", service: "Local JSON store (file-based)" },
    { category: "COMPUTE", service: "Node.js + Express (self-hosted, free)" },
    { category: "NOTIFICATIONS", service: firebaseEnabled ? "Firebase Cloud Messaging (live)" : "Firebase Cloud Messaging (not configured)" },
    { category: "ML", service: "Custom logistic regression (pure JS)" },
    { category: "API", service: "Express REST API" },
    { category: "AUTH", service: firebaseEnabled ? "Firebase Authentication (live)" : "Firebase Authentication (not configured)" },
    { category: "MONITORING", service: "Server console logs" },
  ];

  const leaderboard = [...donors]
    .map((d) => {
      const points = d.totalDonations * 100 + (d.alertsResponded || 0) * 20;
      return { name: d.name, bloodGroup: d.bloodGroup, points, badge: badgeFor(points) };
    })
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const dir = scoringDirectory();
  const avgPredictedScore = dir.length ? (dir.reduce((s, r) => s + r.probability, 0) / dir.length) * 100 : 0;

  res.json({
    stats: {
      registeredDonors: donors.length,
      currentlyEligible: eligible.length,
      totalRequests: requests.length,
      activeEmergencies: active.length,
      alertsSent,
      donorResponseRate: Math.round(responseRate),
      avgPredictedScore: Math.round(avgPredictedScore),
    },
    bloodGroupDistribution,
    urgencyBreakdown,
    infrastructure,
    leaderboard,
    demandForecast: DEMAND_FORECAST,
    hospitalCount: hospitals.length,
  });
});
