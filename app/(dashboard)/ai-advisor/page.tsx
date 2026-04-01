import AdvisorForm from "@/components/ai-advisor/AdvisorForm";
import { getAIAdvisorProfile } from "@/lib/ai/advisor";

export const metadata = {
  title: "AI Trading Advisor | Equio",
  description: "Get personalized AI-driven stock recommendations.",
};

export default async function AIAdvisorPage() {
  const profile = await getAIAdvisorProfile();
  
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col gap-2">
         <h1 className="text-3xl font-bold tracking-tight text-white">AI Trading Advisor</h1>
         <p className="text-gray-400">Configure your parameters, review your portfolio, and consult our algorithmic engine.</p>
      </div>

      <AdvisorForm initialProfile={profile || {}} />
    </div>
  );
}
