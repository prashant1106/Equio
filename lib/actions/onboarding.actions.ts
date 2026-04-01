'use server';

import { auth } from "@/lib/better-auth/auth";
import { headers } from "next/headers";
import { connectToDatabase } from "@/database/mongoose";
import { UserPreferences } from "@/database/models/userPreferences.model";
import { inngest } from "@/lib/inngest/client";

export const onboardGoogleUser = async (data: { country: string, investmentGoals: string, riskTolerance: string, preferredIndustry: string }) => {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { success: false, error: 'Unauthorized' };

    await connectToDatabase();
    
    // Update the preferences if they exist, or create them if they don't (idempotent)
    await UserPreferences.findOneAndUpdate(
      { userId: session.user.id },
      { userId: session.user.id, ...data },
      { upsert: true, new: true }
    );

    // Send the email event so they get the onboarding mail!
    // Wrapped in try/catch to prevent email config errors from breaking core onboarding
    try {
      await inngest.send({
        name: 'app/user.created',
        data: {
          email: session.user.email,
          name: session.user.name,
          ...data
        }
      });
    } catch (inngestError) {
      console.error('Failed to trigger Inngest welcome email:', inngestError);
    }

    return { success: true };
  } catch (error) {
    console.error('Onboarding failed', error);
    return { success: false, error: 'Failed to complete onboarding' };
  }
}
