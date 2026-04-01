'use server';

import { connectToDatabase } from '@/database/mongoose';
import { UserPreferences, type UserPreferencesItem } from '@/database/models/userPreferences.model';
import { fetchJSON } from '@/lib/actions/finnhub.actions';

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export type AIRecommendationLabel = 'BUY' | 'SELL' | 'HOLD';

export interface AIRecommendation {
  symbol: string;
  currentPrice: number | null;
  recommendation: AIRecommendationLabel;
  confidence: number;
  reason: string;
}

export type AIAdvisorInput = {
  initialCapital: number;
  riskTolerance: string;
  investmentGoals: string;
  tradingStyle: string;
  pastTrades: Array<{ symbol: string; buyPrice: number; sellPrice: number; quantity: number }>;
  currentHoldings: Array<{ symbol: string; avgPrice: number; quantity: number }>;
};

// 1. Fetch user's existing profile
export async function getAIAdvisorProfile(): Promise<Partial<AIAdvisorInput> | null> {
  try {
    const { auth } = await import('@/lib/better-auth/auth');
    const { headers } = await import('next/headers');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) return null;

    await connectToDatabase();
    
    const pref = await UserPreferences.findOne({ userId: session.user.id }).lean();
    if (!pref) return null;
    
    return {
      initialCapital: pref.initialCapital || 0,
      riskTolerance: pref.riskTolerance || 'Medium',
      investmentGoals: pref.investmentGoals || 'Growth',
      tradingStyle: pref.tradingStyle || 'swing',
      pastTrades: pref.pastTrades || [],
      currentHoldings: pref.currentHoldings || [],
    };
  } catch (error) {
    console.error("Failed to fetch AI profile:", error);
    return null;
  }
}

// 2. Save and trigger AI analysis
export async function generateAIAdvice(data: AIAdvisorInput): Promise<{ success: boolean; recommendations?: AIRecommendation[]; error?: string }> {
  try {
    const { auth } = await import('@/lib/better-auth/auth');
    const { headers } = await import('next/headers');
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) throw new Error("Unauthorized");

    await connectToDatabase();

    // Persist data per user instruction
    await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { 
        $set: {
          initialCapital: data.initialCapital,
          riskTolerance: data.riskTolerance,
          investmentGoals: data.investmentGoals,
          tradingStyle: data.tradingStyle,
          pastTrades: data.pastTrades,
          currentHoldings: data.currentHoldings,
        }
      },
      { upsert: true }
    );

    // Extract unique symbols from both past trades and holdings to evaluate
    const symbolsToAnalyze = Array.from(new Set([
      ...data.pastTrades.map(t => t.symbol.toUpperCase()),
      ...data.currentHoldings.map(h => h.symbol.toUpperCase())
    ])).filter(Boolean);

    if (symbolsToAnalyze.length === 0) {
      return { success: false, error: "Add at least one past trade or current holding to analyze." };
    }

    const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY || process.env.FINNHUB_API_KEY;
    
    if (!token) {
       return { success: false, error: "FINNHUB API KEY misses in environment" };
    }

    const recommendations: AIRecommendation[] = await Promise.all(
      symbolsToAnalyze.map(async (symbol) => {
        try {
          // Fetch quote
          const quoteUrl = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${token}`;
          const qres = await fetchJSON<any>(quoteUrl, 0); // Need realtime for AI
          
          const currentPrice = qres.c; // Current price
          const dp = qres.dp; // Daily percent change

          // 1. Calculate Trend (+ if bullish, - if bearish)
          // We use daily percent change, bounded to [-10, 10] mapping
          let trendScore = Math.max(-10, Math.min(10, dp || 0)); 
          
          // 2. Calculate Past Track Record Score for this symbol
          const symbolPastTrades = data.pastTrades.filter(t => t.symbol.toUpperCase() === symbol);
          let performanceScore = 0;
          if (symbolPastTrades.length > 0) {
            let totalProfit = 0;
            let totalCost = 0;
            for (const t of symbolPastTrades) {
               totalCost += (t.buyPrice * t.quantity);
               totalProfit += ((t.sellPrice - t.buyPrice) * t.quantity);
            }
            const ROI = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
            // Bound ROI contribution to [-15, 15] base points
            performanceScore = Math.max(-15, Math.min(15, ROI));
          }

          // 3. Risk Tolerance Offset
          let riskOffset = 0;
          const riskStr = data.riskTolerance.toLowerCase();
          if (riskStr === 'high') riskOffset = 5; // Tolerates dipping stocks more
          else if (riskStr === 'low') riskOffset = -5; // Harshly penalizes negative trends

          // 4. Final Aggregation
          // A scale purely arbitrary to mimic simple ML weighting
          // trendWeight = 3.0, performanceWeight = 1.0, riskOffset base
          const totalScore = (trendScore * 3.0) + performanceScore + riskOffset;
          
          let recommendation: AIRecommendationLabel = 'HOLD';
          let confidence = 50;
          let reason = '';

          if (totalScore > 5) {
            recommendation = 'BUY';
            confidence = Math.min(99, 50 + (totalScore * 1.5));
            reason = `Strong upward market indicator${riskStr === 'high' ? ' + matches your high risk appetite.' : '.'}`;
          } else if (totalScore < -5) {
            recommendation = 'SELL';
            confidence = Math.min(99, 50 + (Math.abs(totalScore) * 1.5));
            reason = performanceScore < 0 
                ? 'Historical losses on this asset combined with a bearish downward trend.' 
                : 'Showing a bearish trend against your current profile constraints.';
          } else {
            recommendation = 'HOLD';
            confidence = Math.min(75, 50 + Math.abs(totalScore));
            reason = 'Neutral market movement. No strong statistical signal at this time.';
          }

          return {
            symbol,
            currentPrice,
            recommendation,
            confidence: Math.round(confidence),
            reason
          };
          
        } catch (e) {
          return {
            symbol,
            currentPrice: null,
            recommendation: 'HOLD',
            confidence: 0,
            reason: 'Failed to fetch market data.'
          } as AIRecommendation;
        }
      })
    );

    return { success: true, recommendations };

  } catch (error: any) {
    console.error("AI Advisor Error:", error);
    return { success: false, error: error.message || "Failed to generate AI advice." };
  }
}
