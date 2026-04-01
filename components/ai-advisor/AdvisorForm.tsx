"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2, BrainCircuit } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateAIAdvice, type AIAdvisorInput, type AIRecommendation } from "@/lib/ai/advisor";
import { toast } from "sonner"; // Using standard robust toaster found in Nextjs kits

export default function AdvisorForm({ initialProfile }: { initialProfile: Partial<AIAdvisorInput> }) {
  const [isPending, startTransition] = useTransition();
  
  const [capital, setCapital] = useState(initialProfile.initialCapital || 10000);
  const [risk, setRisk] = useState(initialProfile.riskTolerance || "Medium");
  const [horizon, setHorizon] = useState(initialProfile.investmentGoals || "Growth");
  const [style, setStyle] = useState(initialProfile.tradingStyle || "Swing");
  
  const [pastTrades, setPastTrades] = useState(initialProfile.pastTrades || [{ symbol: "AAPL", buyPrice: 150, sellPrice: 170, quantity: 10 }]);
  const [holdings, setHoldings] = useState(initialProfile.currentHoldings || [{ symbol: "MSFT", avgPrice: 300, quantity: 5 }]);

  const [results, setResults] = useState<AIRecommendation[] | null>(null);

  const addPastTrade = () => {
    setPastTrades([...pastTrades, { symbol: "", buyPrice: 0, sellPrice: 0, quantity: 0 }]);
  };
  const removePastTrade = (index: number) => {
    setPastTrades(pastTrades.filter((_, i) => i !== index));
  };
  const updatePastTrade = (index: number, field: keyof typeof pastTrades[0], value: string) => {
    const updated = [...pastTrades];
    updated[index] = { ...updated[index], [field]: field === "symbol" ? value.toUpperCase() : Number(value) };
    setPastTrades(updated);
  };

  const addHolding = () => {
    setHoldings([...holdings, { symbol: "", avgPrice: 0, quantity: 0 }]);
  };
  const removeHolding = (index: number) => {
    setHoldings(holdings.filter((_, i) => i !== index));
  };
  const updateHolding = (index: number, field: keyof typeof holdings[0], value: string) => {
    const updated = [...holdings];
    updated[index] = { ...updated[index], [field]: field === "symbol" ? value.toUpperCase() : Number(value) };
    setHoldings(updated);
  };

  const onSubmit = () => {
    startTransition(async () => {
      const payload: AIAdvisorInput = {
        initialCapital: capital,
        riskTolerance: risk,
        investmentGoals: horizon,
        tradingStyle: style,
        pastTrades: pastTrades.filter(t => t.symbol.trim() !== ''),
        currentHoldings: holdings.filter(h => h.symbol.trim() !== ''),
      };

      const res = await generateAIAdvice(payload);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      
      if (res.success && res.recommendations) {
        toast.success("AI Analysis Complete");
        setResults(res.recommendations);
      }
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Input Form Column */}
      <div className="space-y-6">
        <Card className="bg-neutral-900/50 border-neutral-800 text-white">
          <CardHeader>
            <CardTitle>Trading Profile</CardTitle>
            <CardDescription className="text-gray-400">Configure your parameters to tailor the AI algorithm.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <Label>Initial Capital ($)</Label>
                 <Input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} className="bg-neutral-800 border-neutral-700" />
               </div>
               <div>
                 <Label>Trading Style</Label>
                 <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Select Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Intraday">Intraday</SelectItem>
                      <SelectItem value="Swing">Swing</SelectItem>
                      <SelectItem value="Long-term">Long-term</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Risk Tolerance</Label>
                 <Select value={risk} onValueChange={setRisk}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Select Risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
               <div>
                 <Label>Investment Horizon</Label>
                 <Select value={horizon} onValueChange={setHorizon}>
                    <SelectTrigger className="bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="Select Horizon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Short-term">Short-term</SelectItem>
                      <SelectItem value="Medium-term">Medium-term</SelectItem>
                      <SelectItem value="Long-term">Long-term</SelectItem>
                      <SelectItem value="Growth">Growth</SelectItem>
                    </SelectContent>
                 </Select>
               </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Holdings */}
        <Card className="bg-neutral-900/50 border-neutral-800 text-white">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Current Holdings</CardTitle>
              <CardDescription className="text-gray-400">Current positions to analyze.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addHolding} className="border-neutral-700 hover:bg-neutral-800"><Plus className="w-4 h-4 mr-2" />Add Holding</Button>
          </CardHeader>
          <CardContent className="space-y-3">
             {holdings.length === 0 && <p className="text-sm text-gray-500">No holdings added.</p>}
             {holdings.map((h, i) => (
                <div key={`idx-h-${i}`} className="flex items-center gap-2">
                  <Input placeholder="AAPL" value={h.symbol} onChange={(e) => updateHolding(i, 'symbol', e.target.value)} className="bg-neutral-800 border-neutral-700 w-24 uppercase" />
                  <Input type="number" placeholder="Avg Px" value={h.avgPrice || ''} onChange={(e) => updateHolding(i, 'avgPrice', e.target.value)} className="bg-neutral-800 border-neutral-700" />
                  <Input type="number" placeholder="Qty" value={h.quantity || ''} onChange={(e) => updateHolding(i, 'quantity', e.target.value)} className="bg-neutral-800 border-neutral-700 w-24" />
                  <Button variant="ghost" size="icon" onClick={() => removeHolding(i)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                </div>
             ))}
          </CardContent>
        </Card>

        {/* Past Trades */}
        <Card className="bg-neutral-900/50 border-neutral-800 text-white">
          <CardHeader className="flex flex-row justify-between items-center">
            <div>
              <CardTitle>Historical Trades</CardTitle>
              <CardDescription className="text-gray-400">Past performance history.</CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={addPastTrade} className="border-neutral-700 hover:bg-neutral-800"><Plus className="w-4 h-4 mr-2" />Add Trade</Button>
          </CardHeader>
          <CardContent className="space-y-3">
             {pastTrades.length === 0 && <p className="text-sm text-gray-500">No past trades added.</p>}
             {pastTrades.map((t, i) => (
                <div key={`idx-pt-${i}`} className="flex items-center gap-2">
                  <Input placeholder="MSFT" value={t.symbol} onChange={(e) => updatePastTrade(i, 'symbol', e.target.value)} className="bg-neutral-800 border-neutral-700 w-24 uppercase" />
                  <Input type="number" placeholder="Buy Px" value={t.buyPrice || ''} onChange={(e) => updatePastTrade(i, 'buyPrice', e.target.value)} className="bg-neutral-800 border-neutral-700" />
                  <Input type="number" placeholder="Sell Px" value={t.sellPrice || ''} onChange={(e) => updatePastTrade(i, 'sellPrice', e.target.value)} className="bg-neutral-800 border-neutral-700" />
                  <Input type="number" placeholder="Qty" value={t.quantity || ''} onChange={(e) => updatePastTrade(i, 'quantity', e.target.value)} className="bg-neutral-800 border-neutral-700 w-20" />
                  <Button variant="ghost" size="icon" onClick={() => removePastTrade(i)} className="text-red-500 hover:text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                </div>
             ))}
          </CardContent>
          <CardFooter>
             <Button onClick={onSubmit} disabled={isPending} className="w-full bg-yellow-500 hover:bg-yellow-600 text-black">
                {isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <BrainCircuit className="w-5 h-5 mr-2" />}
                {isPending ? 'Analyzing Market Data...' : 'Generate AI Advice'}
             </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Output / Results Column */}
      <div className="space-y-6">
         <h2 className="text-2xl font-semibold text-white mb-2 flex items-center">
           <BrainCircuit className="w-6 h-6 mr-3 text-yellow-500" />
           AI Recommendations
         </h2>
         
         {!results ? (
           <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-neutral-800 border-dashed bg-neutral-900/30 text-gray-500 min-h-[300px]">
             {isPending ? (
                <>
                  <Loader2 className="w-12 h-12 mb-4 animate-spin text-yellow-500" />
                  <p>Processing multidimensional market matrix...</p>
                </>
             ) : (
                <>
                  <BrainCircuit className="w-12 h-12 mb-4 opacity-50" />
                  <p>Fill out the form and submit to receive personalized algorithmic trading advice.</p>
                </>
             )}
           </div>
         ) : (
           <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {results.map((rec) => {
               const isBuy = rec.recommendation === 'BUY';
               const isHold = rec.recommendation === 'HOLD';
               const isSell = rec.recommendation === 'SELL';
               
               const colorClass = isBuy ? 'border-emerald-500/50 bg-emerald-500/10' :
                                  isSell ? 'border-red-500/50 bg-red-500/10' :
                                  'border-yellow-500/50 bg-yellow-500/10';
                                  
               const textColor = isBuy ? 'text-emerald-500' :
                                 isSell ? 'text-red-500' : 'text-yellow-500';

               return (
                 <Card key={rec.symbol} className={`border ${colorClass} text-white`}>
                   <CardHeader className="pb-2">
                     <div className="flex justify-between items-start">
                       <div>
                         <CardTitle className="text-xl font-bold flex items-center gap-2">
                            {rec.symbol}
                            <span className="text-sm font-medium px-2 py-0.5 rounded bg-black/50 border border-white/10 uppercase tracking-wider">
                              <span className={textColor}>{rec.recommendation}</span>
                            </span>
                         </CardTitle>
                         {rec.currentPrice && <CardDescription className="text-gray-300">Px: ${rec.currentPrice.toFixed(2)}</CardDescription>}
                       </div>
                       <div className="text-right">
                         <div className="text-2xl font-bold">{rec.confidence}%</div>
                         <div className="text-xs text-gray-400">CONFIDENCE</div>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent>
                     <p className="text-gray-300 text-sm leading-relaxed">{rec.reason}</p>
                   </CardContent>
                 </Card>
               );
             })}
           </div>
         )}
      </div>
    </div>
  );
}
