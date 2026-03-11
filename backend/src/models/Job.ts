import mongoose from "mongoose";

const screeningConfigSchema = new mongoose.Schema(
  {
    passThreshold: { type: Number, min: 1, max: 100, default: 70 },
    reviewThreshold: { type: Number, min: 0, max: 99, default: 40 },
    resumeWeight: { type: Number, min: 0, max: 100, default: 25 },
    coverLetterWeight: { type: Number, min: 0, max: 100, default: 20 },
    phoneWeight: { type: Number, min: 0, max: 100, default: 10 },
    emailWeight: { type: Number, min: 0, max: 100, default: 10 },
    keywordWeight: { type: Number, min: 0, max: 100, default: 35 },
    keywordList: [{ type: String, trim: true, lowercase: true }]
  },
  { _id: false }
);

const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    company: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: { type: String, enum: ["open", "closed"], default: "open" },
    screeningConfig: { type: screeningConfigSchema, default: () => ({}) },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

export const Job = mongoose.model("Job", jobSchema);
