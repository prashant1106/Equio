'use server';

import {auth} from "@/lib/better-auth/auth";
import {inngest} from "@/lib/inngest/client";
import {headers} from "next/headers";
import { connectToDatabase } from "@/database/mongoose";
import { UserPreferences } from "@/database/models/userPreferences.model";

export const signUpWithEmail = async ({ email, password, fullName, country, investmentGoals, riskTolerance, preferredIndustry }: SignUpFormData) => {
  try {
    const response = await auth.api.signUpEmail({ body: { email, password, name: fullName } })

    if(response) {
      await connectToDatabase();
      await UserPreferences.create({
        userId: response.user.id,
        country,
        investmentGoals,
        riskTolerance,
        preferredIndustry
      });

      await inngest.send({
        name: 'app/user.created',
        data: { email, name: fullName, country, investmentGoals, riskTolerance, preferredIndustry }
      })
    }

    return { success: true, data: response }
  } catch (e) {
    console.log('Sign up failed', e)
    return { success: false, error: 'Sign up failed' }
  }
}

export const signInWithEmail = async ({ email, password }: SignInFormData) => {
  try {
    const response = await auth.api.signInEmail({ body: { email, password } })

    return { success: true, data: response }
  } catch (e) {
    console.log('Sign in failed', e)
    return { success: false, error: 'Sign in failed' }
  }
}

export const signOut = async () => {
  try {
    await auth.api.signOut({ headers: await headers() });
  } catch (e) {
    console.log('Sign out failed', e)
    return { success: false, error: 'Sign out failed' }
  }
}