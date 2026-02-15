import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  resumeText: string;
  skills: string[];
  selectedRole: string;
  matchScore: number;
  roadmap: any;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true },
    resumeText: { type: String, required: true },
    skills: { type: [String], default: [] },
    selectedRole: { type: String, required: true },
    matchScore: { type: Number, required: true },
    roadmap: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const User = models.User || model<IUser>("User", UserSchema);
