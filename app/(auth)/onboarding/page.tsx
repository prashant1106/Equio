'use client';

import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import SelectField from "@/components/forms/SelectField";
import { INVESTMENT_GOALS, PREFERRED_INDUSTRIES, RISK_TOLERANCE_OPTIONS } from "@/lib/constants";
import { CountrySelectField } from "@/components/forms/CountrySelectField";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { onboardGoogleUser } from "@/lib/actions/onboarding.actions";

type OnboardingFormData = {
  country: string;
  investmentGoals: string;
  riskTolerance: string;
  preferredIndustry: string;
};

const OnboardingPage = () => {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormData>({
    defaultValues: {
      country: 'IN',
      investmentGoals: 'Growth',
      riskTolerance: 'Medium',
      preferredIndustry: 'Technology'
    },
    mode: 'onBlur'
  });

  const onSubmit = async (data: OnboardingFormData) => {
    try {
      const result = await onboardGoogleUser(data);
      if (result.success) {
        toast.success("Profile completed successfully!");
        router.push("/");
      } else {
        toast.error("Failed to save profile", { description: result.error });
      }
    } catch (e) {
      console.error(e);
      toast.error('Unexpected error', { description: 'Please try again' });
    }
  };

  return (
    <>
      <h1 className="form-title">Complete Your Profile</h1>
      <p className="text-gray-400 mb-8 text-center max-w-sm mx-auto">
        We need a few more details to personalize your Equio experience.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <CountrySelectField
          name="country"
          label="Country"
          control={control}
          error={errors.country}
          required
        />

        <SelectField
          name="investmentGoals"
          label="Investment Goals"
          placeholder="Select your investment goal"
          options={INVESTMENT_GOALS}
          control={control}
          error={errors.investmentGoals}
          required
        />

        <SelectField
          name="riskTolerance"
          label="Risk Tolerance"
          placeholder="Select your risk level"
          options={RISK_TOLERANCE_OPTIONS}
          control={control}
          error={errors.riskTolerance}
          required
        />

        <SelectField
          name="preferredIndustry"
          label="Preferred Industry"
          placeholder="Select your preferred industry"
          options={PREFERRED_INDUSTRIES}
          control={control}
          error={errors.preferredIndustry}
          required
        />

        <div className="flex flex-col gap-3 mt-5 w-full">
          <Button type="submit" disabled={isSubmitting} className="yellow-btn w-full">
            {isSubmitting ? 'Saving Profile...' : 'Complete Setup'}
          </Button>
        </div>
      </form>
    </>
  );
};

export default OnboardingPage;
