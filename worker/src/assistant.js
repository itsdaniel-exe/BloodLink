// Donor Intelligence Assistant
// A RAG pattern built from (1) keyword-based intent classification, (2) live data
// retrieval, and (3) a four-part Chain-of-Thought response template (context -> finding
// -> supporting data -> recommendation) - no external LLM API required or used.
//
// Ported from the Express version: identical intents and response templates, but every
// handler now receives the already-loaded `state` rather than reaching into a module-level
// store, so it runs statelessly per request on Workers.
import { BLOOD_GROUPS, BLOOD_GROUP_RARITY, haversineKm, isEligible } from "./utils.js";
import { scoringDirectory } from "./ml.js";

// Each intent scores a query by counting how many of its keyword patterns match.
// The highest-scoring intent wins; ties fall back to array order. This avoids a single
// generic word (e.g. "how many") from hijacking a more specific intent like urgency.
const INTENTS = [
  {
    key: "URGENCY_ANALYSIS",
    patterns: [/\burgent\b/i, /\bcritical\b/i, /\bemergenc\w*/i, /\bimmediate\b/i, /\bactive request/i],
  },
  {
    key: "DONOR_PROXIMITY",
    patterns: [/\bnear\b/i, /\bnearby\b/i, /\bkm\b/i, /\bdistance\b/i, /\bclosest\b/i, /\bproximity\b/i, /\bwithin\b/i],
  },
  {
    key: "DONOR_ELIGIBILITY",
    patterns: [/\beligible\b/i, /\beligibility\b/i, /last donated/i, /90 days/i, /ready to donate/i, /cleared to donate/i],
  },
  {
    key: "BLOOD_GROUP_RARITY",
    patterns: [/\brare\b/i, /\brarity\b/i, /\bscarce\b/i, /least common/i, /\brarest\b/i],
  },
  {
    key: "RESPONSE_RATE",
    patterns: [/response rate/i, /\bengagement\b/i, /\boptimization\b/i, /success rate/i, /\bconfirmed\b/i],
  },
  {
    key: "REQUEST_HISTORY",
    patterns: [/\bhistory\b/i, /\bpast\b/i, /\bprevious\b/i, /\btrend\b/i, /\bmonthly\b/i],
  },
  {
    key: "OVERALL_SUMMARY",
    patterns: [/\bsummary\b/i, /\boverview\b/i, /\breport\b/i, /\bdashboard\b/i, /complete .*status/i],
  },
  {
    key: "BLOOD_AVAILABILITY",
    patterns: [/\bavailable\b/i, /\bavailability\b/i, /how many .*(donor|blood|unit)/i, /\bstock\b/i, /\bunits\b/i, /\bcount\b/i],
  },
];

function findBloodGroup(query) {
  const normalized = query.toUpperCase().replace(/\s+/g, "");
  for (const bg of BLOOD_GROUPS) {
    if (normalized.includes(bg)) return bg;
  }
  if (/o[\s-]?neg/i.test(query)) return "O-";
  if (/o[\s-]?pos/i.test(query)) return "O+";
  if (/ab[\s-]?neg/i.test(query)) return "AB-";
  if (/ab[\s-]?pos/i.test(query)) return "AB+";
  return null;
}

function findHospital(state, query) {
  const q = query.toLowerCase();
  return state.hospitals.find((h) => q.includes(h.name.toLowerCase())) || null;
}

function classify(query) {
  let best = { key: "GENERAL", score: 0 };
  for (const intent of INTENTS) {
    const score = intent.patterns.reduce((s, p) => s + (p.test(query) ? 1 : 0), 0);
    if (score > best.score) best = { key: intent.key, score };
  }
  return best.key;
}

function handleBloodAvailability(state, query) {
  const { donors } = state;
  const bg = findBloodGroup(query);
  const eligibleDonors = donors.filter(isEligible);

  if (bg) {
    const total = donors.filter((d) => d.bloodGroup === bg).length;
    const eligible = eligibleDonors.filter((d) => d.bloodGroup === bg).length;
    return [
      `Analysing ${donors.length} registered donors for blood group ${bg} availability...`,
      `The most critical finding is: **${eligible} eligible ${bg} donor${eligible === 1 ? "" : "s"}** currently available out of ${total} registered.`,
      `• Total registered ${bg} donors: ${total}\n• Currently eligible: ${eligible}\n• Temporarily unavailable/recently donated: ${total - eligible}`,
      eligible > 0
        ? `Recommended action: Proceed with donor matching and dispatch alerts to the ${eligible} eligible ${bg} donor${eligible === 1 ? "" : "s"}.`
        : `Recommended action: No eligible ${bg} donors right now - consider checking compatible donor blood groups or expanding the search radius.`,
    ].join("\n\n");
  }

  const breakdown = BLOOD_GROUPS.map((g) => `${g}: ${eligibleDonors.filter((d) => d.bloodGroup === g).length}`).join(" | ");
  return [
    `Analysing ${donors.length} registered donors and ${eligibleDonors.length} currently eligible donors in the BloodLink system...`,
    `The most critical finding is: **${eligibleDonors.length} of ${donors.length} donors are eligible to donate right now.**`,
    `• Eligible donors by blood group: ${breakdown}`,
    `Recommended action: Prioritise outreach to rarer groups first (AB-, O-, B-) when running broadcast alerts.`,
  ].join("\n\n");
}

function handleDonorProximity(state, query) {
  const { donors } = state;
  const hospital = findHospital(state, query) || state.hospitals[0];
  const bg = findBloodGroup(query);
  let pool = donors.filter(isEligible);
  if (bg) pool = pool.filter((d) => d.bloodGroup === bg);

  const ranked = pool
    .map((d) => ({ d, dist: haversineKm(d.lat, d.lng, hospital.lat, hospital.lng) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5);

  return [
    `Analysing donor proximity to ${hospital.name} (${hospital.city})${bg ? ` for blood group ${bg}` : ""}...`,
    `The most critical finding is: **${ranked[0]?.d.name ?? "No donor found"}** is the closest eligible donor at ${ranked[0] ? ranked[0].dist.toFixed(1) : "-"} km.`,
    ranked.length
      ? ranked.map((r) => `• ${r.d.name} (${r.d.bloodGroup}) - ${r.dist.toFixed(1)} km away`).join("\n")
      : "• No eligible donors matched this query",
    `Recommended action: Alert the top ${Math.min(3, ranked.length)} closest donors first to minimise emergency response time.`,
  ].join("\n\n");
}

function handleUrgencyAnalysis(state) {
  const { requests, hospitals } = state;
  const active = requests.filter((r) => r.status === "ACTIVE");
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  const sorted = [...active].sort((a, b) => order[a.urgency] - order[b.urgency]);
  const critical = active.filter((r) => r.urgency === "CRITICAL");

  return [
    `Analysing ${requests.length} total requests, ${active.length} currently active in the BloodLink system...`,
    `The most critical finding is: **${critical.length} CRITICAL request${critical.length === 1 ? "" : "s"}** requiring immediate donor dispatch.`,
    sorted
      .slice(0, 5)
      .map((r) => {
        const h = hospitals.find((hh) => hh.id === r.hospitalId);
        return `• ${h?.name ?? r.hospitalId} - ${r.bloodGroup} - ${r.urgency} - ${r.donorsFound}/${r.donorsAlerted} donors found`;
      })
      .join("\n"),
    `Recommended action: Dispatch broadcast push alerts for all CRITICAL and HIGH urgency requests immediately, prioritised by units needed.`,
  ].join("\n\n");
}

function handleDonorEligibility(state, query) {
  const { donors } = state;
  const bg = findBloodGroup(query);
  const pool = bg ? donors.filter((d) => d.bloodGroup === bg) : donors;
  const eligible = pool.filter(isEligible);
  const ineligible = pool.filter((d) => !isEligible(d));

  return [
    `Analysing donor eligibility${bg ? ` for blood group ${bg}` : ""} based on the 90-day donation gap rule...`,
    `The most critical finding is: **${eligible.length} of ${pool.length}** donor${pool.length === 1 ? "" : "s"} are cleared to donate now.`,
    `• Eligible: ${eligible.map((d) => d.name).join(", ") || "none"}\n• Not yet eligible: ${ineligible.map((d) => d.name).join(", ") || "none"}`,
    `Recommended action: Route new alerts only to eligible donors to avoid notification fatigue.`,
  ].join("\n\n");
}

function handleRequestHistory(state) {
  const { requests } = state;
  const byMonth = {};
  for (const r of requests) {
    const m = r.createdAt.slice(0, 7);
    byMonth[m] = (byMonth[m] || 0) + 1;
  }
  const fulfilled = requests.filter((r) => r.status === "FULFILLED").length;
  const rate = requests.length ? ((fulfilled / requests.length) * 100).toFixed(1) : "0.0";

  return [
    `Analysing ${requests.length} logged blood requests across the request history...`,
    `The most critical finding is: **${fulfilled} of ${requests.length} requests (${rate}%)** have been fully fulfilled.`,
    Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([m, c]) => `• ${m}: ${c} request${c === 1 ? "" : "s"}`)
      .join("\n"),
    `Recommended action: Monitor months with elevated request volume to pre-position inventory and donor outreach.`,
  ].join("\n\n");
}

function handleBloodGroupRarity(state) {
  const { donors } = state;
  const counts = BLOOD_GROUPS.map((g) => ({
    group: g,
    count: donors.filter((d) => d.bloodGroup === g).length,
    rarity: BLOOD_GROUP_RARITY[g],
  })).sort((a, b) => a.count - b.count);
  const rarest = counts[0];

  return [
    `Analysing blood group distribution across ${donors.length} registered donors...`,
    `The most critical finding is: **${rarest.group}** has the fewest registered donors (${rarest.count}), clinical rarity score ${rarest.rarity}.`,
    counts.map((c) => `• ${c.group}: ${c.count} donor${c.count === 1 ? "" : "s"} (rarity ${c.rarity})`).join("\n"),
    `Recommended action: Run a proactive donor recruitment campaign targeting ${rarest.group} donors.`,
  ].join("\n\n");
}

function handleResponseRate(state) {
  const { alerts, responses, donors } = state;
  const sent = alerts.length || donors.reduce((s, d) => s + (d.alertsReceived || 0), 0);
  const confirmed =
    responses.filter((r) => r.status === "CONFIRMED").length ||
    donors.reduce((s, d) => s + (d.alertsResponded || 0), 0);
  const rate = sent ? (confirmed / sent) * 100 : 0;

  return [
    `Analysing push alert dispatch and donor response tracking...`,
    `📩 Targeting Success Rate:`,
    `• Alerts Dispatched: ${sent}\n• Confirmed Responses: ${confirmed}\n• AI Optimization Rate: **${rate.toFixed(1)}%**`,
    `Recommended action: ${rate >= 60 ? "Current targeting strategy is performing well - maintain the 0.60/0.40 probability/proximity ranking weights." : "Consider re-weighting the ranking formula toward proximity to improve response rate."}`,
  ].join("\n\n");
}

function handleOverallSummary(state) {
  const { donors, requests, hospitals, alerts } = state;
  const eligible = donors.filter(isEligible).length;
  const active = requests.filter((r) => r.status === "ACTIVE").length;
  const dir = scoringDirectory(state);
  const avgProb = dir.length ? (dir.reduce((s, r) => s + r.probability, 0) / dir.length) * 100 : 0;

  return [
    `Analysing ${donors.length} registered donors and ${requests.length} logged requests for a complete system overview...`,
    `The most critical finding is: **${active} active emergenc${active === 1 ? "y" : "ies"}** across ${hospitals.length} partner hospitals.`,
    `• Registered donors: ${donors.length} (${eligible} eligible)\n• Total requests: ${requests.length}\n• Alerts sent: ${alerts.length}\n• Avg. predicted response probability: ${avgProb.toFixed(1)}%`,
    `Recommended action: Focus donor recruitment on rare blood groups and keep hospital inventory levels above the ${state.minInventoryLevel}-unit safety threshold.`,
  ].join("\n\n");
}

function handleGeneral() {
  return [
    "I am the infrastructure analysis assistant. Try asking me:",
    "• 'How many O-negative donors are available?'",
    "• 'What is the donor response rate?'",
    "• 'Show me blood group distribution'",
    "• 'How many active emergency requests?'",
    "• 'Which donors are eligible right now?'",
  ].join("\n");
}

export function answerQuery(query, state) {
  const intent = classify(query || "");
  let answer;
  switch (intent) {
    case "BLOOD_AVAILABILITY":
      answer = handleBloodAvailability(state, query);
      break;
    case "DONOR_PROXIMITY":
      answer = handleDonorProximity(state, query);
      break;
    case "URGENCY_ANALYSIS":
      answer = handleUrgencyAnalysis(state);
      break;
    case "DONOR_ELIGIBILITY":
      answer = handleDonorEligibility(state, query);
      break;
    case "REQUEST_HISTORY":
      answer = handleRequestHistory(state);
      break;
    case "BLOOD_GROUP_RARITY":
      answer = handleBloodGroupRarity(state);
      break;
    case "RESPONSE_RATE":
      answer = handleResponseRate(state);
      break;
    case "OVERALL_SUMMARY":
      answer = handleOverallSummary(state);
      break;
    default:
      answer = handleGeneral();
  }
  return { intent, answer };
}
