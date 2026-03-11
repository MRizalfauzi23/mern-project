const TEMP_EMAIL_DOMAINS = ["mailinator.com", "10minutemail.com", "tempmail.com"];
const DEFAULT_CONFIG = {
  passThreshold: 70,
  reviewThreshold: 40,
  resumeWeight: 25,
  coverLetterWeight: 20,
  phoneWeight: 10,
  emailWeight: 10,
  keywordWeight: 35,
  keywordList: []
};

function extractKeywords(text) {
  return (text || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((word) => word.length >= 4);
}

function normalizeKeywords(list = []) {
  return Array.from(
    new Set(
      list
        .map((item) => String(item || "").trim().toLowerCase())
        .filter(Boolean)
    )
  );
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getScreeningConfig(job) {
  const raw = job?.screeningConfig || {};
  const config = {
    passThreshold: Math.max(1, Math.min(100, toNumber(raw.passThreshold, DEFAULT_CONFIG.passThreshold))),
    reviewThreshold: Math.max(0, Math.min(99, toNumber(raw.reviewThreshold, DEFAULT_CONFIG.reviewThreshold))),
    resumeWeight: Math.max(0, toNumber(raw.resumeWeight, DEFAULT_CONFIG.resumeWeight)),
    coverLetterWeight: Math.max(0, toNumber(raw.coverLetterWeight, DEFAULT_CONFIG.coverLetterWeight)),
    phoneWeight: Math.max(0, toNumber(raw.phoneWeight, DEFAULT_CONFIG.phoneWeight)),
    emailWeight: Math.max(0, toNumber(raw.emailWeight, DEFAULT_CONFIG.emailWeight)),
    keywordWeight: Math.max(0, toNumber(raw.keywordWeight, DEFAULT_CONFIG.keywordWeight)),
    keywordList: normalizeKeywords(raw.keywordList || DEFAULT_CONFIG.keywordList)
  };
  if (config.reviewThreshold >= config.passThreshold) {
    config.reviewThreshold = Math.max(0, config.passThreshold - 1);
  }
  return config;
}

function toRatioFromCoverLetter(letterLength) {
  if (letterLength >= 120) return 1;
  if (letterLength >= 50) return 0.6;
  if (letterLength > 0) return 0.25;
  return 0;
}

function toRatioFromKeywords(matchCount, targetCount) {
  if (!targetCount) return 0;
  const strongThreshold = Math.max(1, Math.ceil(targetCount * 0.7));
  const mediumThreshold = Math.max(1, Math.ceil(targetCount * 0.35));
  if (matchCount >= strongThreshold) return 1;
  if (matchCount >= mediumThreshold) return 0.6;
  if (matchCount > 0) return 0.3;
  return 0;
}

export function evaluateApplication({ job, candidateEmail, phone, coverLetter, resumeUrl }) {
  const config = getScreeningConfig(job);
  let totalPoints = 0;
  let totalWeight = 0;
  const breakdown = [];
  const reasons = [];

  const addRule = ({ key, label, weight, ratio, detail, meta = {} }) => {
    if (!weight) return;
    const boundedRatio = Math.max(0, Math.min(1, ratio));
    const points = Number((boundedRatio * weight).toFixed(2));
    breakdown.push({ ruleKey: key, label, weight, maxScore: weight, score: points, detail, ...meta });
    totalPoints += points;
    totalWeight += weight;
    reasons.push(detail);
  };

  addRule({
    key: "resume",
    label: "Ketersediaan CV",
    weight: config.resumeWeight,
    ratio: resumeUrl ? 1 : 0,
    detail: resumeUrl ? "CV tersedia." : "CV belum diunggah."
  });

  const letterLength = (coverLetter || "").trim().length;
  addRule({
    key: "cover_letter",
    label: "Kualitas Cover Letter",
    weight: config.coverLetterWeight,
    ratio: toRatioFromCoverLetter(letterLength),
    detail:
      letterLength >= 120
        ? "Cover letter lengkap."
        : letterLength >= 50
          ? "Cover letter cukup."
          : letterLength > 0
            ? "Cover letter terlalu singkat."
            : "Cover letter tidak diisi.",
    meta: { letterLength }
  });

  addRule({
    key: "phone",
    label: "Kelengkapan Telepon",
    weight: config.phoneWeight,
    ratio: phone?.trim() ? 1 : 0,
    detail: phone?.trim() ? "Nomor telepon tersedia." : "Nomor telepon tidak tersedia."
  });

  const domain = (candidateEmail || "").split("@")[1]?.toLowerCase();
  const isTrustedDomain = Boolean(domain && !TEMP_EMAIL_DOMAINS.includes(domain));
  addRule({
    key: "email_domain",
    label: "Validitas Domain Email",
    weight: config.emailWeight,
    ratio: isTrustedDomain ? 1 : 0,
    detail: isTrustedDomain ? "Email valid non-temporary." : "Email terindikasi temporary.",
    meta: { emailDomain: domain || "" }
  });

  const jobKeywords = config.keywordList.length
    ? config.keywordList
    : normalizeKeywords(extractKeywords(`${job?.title || ""} ${job?.description || ""}`));
  const letterKeywords = new Set(extractKeywords(coverLetter));
  const matchedKeywords = jobKeywords.filter((word) => letterKeywords.has(word));
  const keywordRatio = toRatioFromKeywords(matchedKeywords.length, jobKeywords.length);
  addRule({
    key: "keywords",
    label: "Kecocokan Keyword",
    weight: config.keywordWeight,
    ratio: keywordRatio,
    detail:
      keywordRatio >= 1
        ? "Kecocokan keyword dengan lowongan sangat baik."
        : keywordRatio >= 0.6
          ? "Kecocokan keyword dengan lowongan cukup."
          : keywordRatio > 0
            ? "Kecocokan keyword dengan lowongan minim."
            : "Kecocokan keyword dengan lowongan rendah.",
    meta: {
      matchedKeywords,
      matchedCount: matchedKeywords.length,
      targetKeywords: jobKeywords,
      targetCount: jobKeywords.length
    }
  });

  const normalizedScore = totalWeight ? Math.round((totalPoints / totalWeight) * 100) : 0;
  const score = Math.max(0, Math.min(100, normalizedScore));
  const screeningResult = score >= config.passThreshold ? "pass" : score >= config.reviewThreshold ? "review" : "reject";
  const screeningRecommendedStatus = screeningResult === "reject" ? "rejected" : "screening";

  return {
    screeningScore: score,
    screeningResult,
    screeningRecommendedStatus,
    screeningBreakdown: breakdown,
    screeningReasons: reasons,
    screenedAt: new Date(),
    screeningConfigUsed: config
  };
}
