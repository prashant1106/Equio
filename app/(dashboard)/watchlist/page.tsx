import { getWatchlist, removeFromWatchlist } from "@/lib/actions/watchlist.actions";
import { fetchJSON } from "@/lib/actions/finnhub.actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import SearchCommand from "@/components/SearchCommand";

export default async function WatchlistPage() {
  const watchlist = await getWatchlist();

  // Fetch latest prices for watchlisted stocks
  const watchlistWithPrices = await Promise.all(
    watchlist.map(async (item: any) => {
      try {
        const token = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        const res = await fetchJSON<any>(`https://finnhub.io/api/v1/quote?symbol=${item.symbol}&token=${token}`, 60);
        return {
          ...item,
          currentPrice: res.c,
          change: res.d,
          percentChange: res.dp
        };
      } catch (e) {
        return { ...item, currentPrice: null, change: null, percentChange: null };
      }
    })
  );

  const handleRemove = async (formData: FormData) => {
    "use server";
    const symbol = formData.get("symbol") as string;
    await removeFromWatchlist(symbol);
    revalidatePath("/watchlist");
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Your Watchlist</h1>
        {watchlistWithPrices.length > 0 && (
          <SearchCommand renderAs="button" label="Add Stocks" initialStocks={[]} />
        )}
      </div>

      {watchlistWithPrices.length === 0 ? (
        <div className="text-center py-20 border border-neutral-800 rounded-xl bg-neutral-900/50">
          <p className="text-gray-400 mb-4">You have not added any stocks to your watchlist yet.</p>
          <center><SearchCommand renderAs="button" label="Search Stocks to Add" initialStocks={[]} /></center>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {watchlistWithPrices.map((stock: any) => (
            <div key={stock.symbol} className="p-5 flex flex-col justify-between border border-neutral-800 rounded-xl bg-neutral-900/50 hover:border-yellow-500/50 transition-colors group">
              <div className="flex justify-between items-start mb-4">
                <Link href={`/stocks/${stock.symbol}`} className="hover:opacity-80 transition-opacity">
                  <h3 className="text-xl font-bold text-white mb-1 group-hover:text-yellow-500 transition-colors">{stock.symbol}</h3>
                  <p className="text-sm text-gray-400 line-clamp-1">{stock.company}</p>
                </Link>
                <form action={handleRemove}>
                  <input type="hidden" name="symbol" value={stock.symbol} />
                  <Button type="submit" variant="ghost" size="icon" className="text-red-500/50 hover:text-red-500 hover:bg-red-500/10 h-8 w-8">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </form>
              </div>

              <div className="mt-8 flex justify-between items-end">
                <div className="text-2xl font-bold text-white">
                  {stock.currentPrice !== null ? `$${stock.currentPrice.toFixed(2)}` : '---'}
                </div>
                {stock.percentChange !== null && (
                  <div className={`text-sm font-medium ${stock.percentChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stock.percentChange >= 0 ? '+' : ''}{stock.percentChange.toFixed(2)}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
