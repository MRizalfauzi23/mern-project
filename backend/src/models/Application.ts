import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidateName: { type: String, required: true, trim: true },
    candidateEmail: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    resumeUrl: { type: String, trim: true, default: "" },
    coverLetter: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["screening", "interview", "offer", "hired", "rejected"],
      default: "screening"
    },
    screeningScore: { type: Number, default: 0 },
    screeningResult: {
      type: String,
      enum: ["pass", "review", "reject"],
      default: "review"
    },
    screeningRecommendedStatus: {
      type: String,
      enum: ["screening", "interview", "offer", "hired", "rejected"],
      default: "screening"
    },
    screeningReasons: [{ type: String }],
    screeningBreakdown: [
      {
        ruleKey: { type: String, required: true, trim: true },
        label: { type: String, required: true, trim: true },
        weight: { type: Number, required: true },
        maxScore: { type: Number, required: true },
        score: { type: Number, required: true },
        detail: { type: String, required: true, trim: true },
        letterLength: { type: Number },
        emailDomain: { type: String, trim: true },
        matchedKeywords: [{ type: String, trim: true }],
        matchedCount: { type: Number },
        targetKeywords: [{ type: String, trim: true }],
        targetCount: { type: Number }
      }
    ],
    screeningConfigUsed: {
      passThreshold: { type: Number },
      reviewThreshold: { type: Number },
      resumeWeight: { type: Number },
      coverLetterWeight: { type: Number },
      phoneWeight: { type: Number },
      emailWeight: { type: Number },
      keywordWeight: { type: Number },
      keywordList: [{ type: String, trim: true }]
    },
    screenedAt: { type: Date, default: Date.now },
    statusHistory: [
      {
        status: {
          type: String,
          enum: ["screening", "interview", "offer", "hired", "rejected"],
          required: true
        },
        changedAt: { type: Date, default: Date.now }
      }
    ],
    recruiterNotes: [
      {
        note: { type: String, required: true, trim: true },
        authorEmail: { type: String, required: true, trim: true, lowercase: true },
        createdAt: { type: Date, default: Date.now }
      }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

applicationSchema.index({ job: 1, candidateEmail: 1 }, { unique: true });

export const Application = mongoose.model("Application", applicationSchema);
