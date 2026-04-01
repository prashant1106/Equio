import { Schema, model, models, type Model, type Document } from 'mongoose';

export interface UserPreferencesItem extends Document {
  userId: string;
  country?: string;
  investmentGoals?: string;
  riskTolerance?: string;
  preferredIndustry?: string;
  initialCapital?: number;
  tradingStyle?: string;
  pastTrades?: Array<{ symbol: string; buyPrice: number; sellPrice: number; quantity: number }>;
  currentHoldings?: Array<{ symbol: string; avgPrice: number; quantity: number }>;
  createdAt: Date;
}

const UserPreferencesSchema = new Schema<UserPreferencesItem>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    country: { type: String, trim: true },
    investmentGoals: { type: String, trim: true },
    riskTolerance: { type: String, trim: true },
    preferredIndustry: { type: String, trim: true },
    initialCapital: { type: Number },
    tradingStyle: { type: String, trim: true },
    pastTrades: [
      {
        symbol: { type: String, trim: true },
        buyPrice: { type: Number },
        sellPrice: { type: Number },
        quantity: { type: Number },
      }
    ],
    currentHoldings: [
      {
        symbol: { type: String, trim: true },
        avgPrice: { type: Number },
        quantity: { type: Number },
      }
    ],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

export const UserPreferences: Model<UserPreferencesItem> =
  (models?.UserPreferences as Model<UserPreferencesItem>) || model<UserPreferencesItem>('UserPreferences', UserPreferencesSchema);
