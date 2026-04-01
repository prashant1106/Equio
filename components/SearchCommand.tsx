"use client"

import { useEffect, useState, useTransition } from "react"
import { CommandDialog, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command"
import {Button} from "@/components/ui/button";
import {Loader2,  TrendingUp, Star} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {searchStocks} from "@/lib/actions/finnhub.actions";
import {useDebounce} from "@/hooks/useDebounce";
import { addToWatchlist, removeFromWatchlist, getWatchlist } from "@/lib/actions/watchlist.actions";

export default function SearchCommand({ renderAs = 'button', label = 'Add stock', initialStocks }: SearchCommandProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<StockWithWatchlistStatus[]>(initialStocks);
  const [watchlisted, setWatchlisted] = useState<string[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getWatchlist().then((list: any[]) => {
      if (list && Array.isArray(list)) {
        setWatchlisted(list.map((item) => item.symbol));
      }
    }).catch(console.error);
  }, [open]);

  const handleToggleWatchlist = (e: React.MouseEvent, stock: any) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggling) return;

    setToggling(stock.symbol);
    const isWatchlisted = watchlisted.includes(stock.symbol);

    // Optimistic UI update
    if (isWatchlisted) {
      setWatchlisted(prev => prev.filter(s => s !== stock.symbol));
    } else {
      setWatchlisted(prev => [...prev, stock.symbol]);
    }

    startTransition(async () => {
      try {
        if (isWatchlisted) {
          await removeFromWatchlist(stock.symbol);
        } else {
          await addToWatchlist({ symbol: stock.symbol, company: stock.name });
        }
        router.refresh();
      } catch (e) {
        console.error(e);
        // Revert optimistic update on error
        if (isWatchlisted) {
          setWatchlisted(prev => [...prev, stock.symbol]);
        } else {
          setWatchlisted(prev => prev.filter(s => s !== stock.symbol));
        }
      } finally {
        setToggling(null);
      }
    });
  };

  const isSearchMode = !!searchTerm.trim();
  const displayStocks = isSearchMode ? stocks : stocks?.slice(0, 10);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen(v => !v)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const handleSearch = async () => {
    if(!isSearchMode) return setStocks(initialStocks);

    setLoading(true)
    try {
        const results = await searchStocks(searchTerm.trim());
        setStocks(results);
    } catch {
      setStocks([])
    } finally {
      setLoading(false)
    }
  }

  const debouncedSearch = useDebounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch();
  }, [searchTerm]);

  const handleSelectStock = () => {
    setOpen(false);
    setSearchTerm("");
    setStocks(initialStocks);
  }

  return (
    <>
      {renderAs === 'text' ? (
          <span onClick={() => setOpen(true)} className="search-text">
            {label}
          </span>
      ): (
          <Button onClick={() => setOpen(true)} className="search-btn">
            {label}
          </Button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen} className="search-dialog">
        <div className="search-field">
          <CommandInput value={searchTerm} onValueChange={setSearchTerm} placeholder="Search stocks..." className="search-input" />
          {loading && <Loader2 className="search-loader" />}
        </div>
        <CommandList className="search-list">
          {loading ? (
              <CommandEmpty className="search-list-empty">Loading stocks...</CommandEmpty>
          ) : displayStocks?.length === 0 ? (
              <div className="search-list-indicator">
                {isSearchMode ? 'No results found' : 'No stocks available'}
              </div>
            ) : (
            <ul>
              <div className="search-count">
                {isSearchMode ? 'Search results' : 'Popular stocks'}
                {` `}({displayStocks?.length || 0})
              </div>
              {displayStocks?.map((stock, i) => (
                  <li key={`${stock.symbol}-${stock.exchange || 'idx'}-${i}`} className="search-item group flex items-center pr-2">
                    <Link
                        href={`/stocks/${stock.symbol}`}
                        onClick={handleSelectStock}
                        className="search-item-link flex-1"
                    >
                      <TrendingUp className="h-4 w-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="search-item-name">
                          {stock.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {stock.symbol} | {stock.exchange } | {stock.type}
                        </div>
                      </div>
                    </Link>
                    <button 
                      type="button"
                      onClick={(e) => handleToggleWatchlist(e, stock)}
                      className="p-2 hover:bg-neutral-800 rounded-full transition-colors flex-shrink-0"
                      disabled={toggling === stock.symbol}
                    >
                      {toggling === stock.symbol ? (
                         <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      ) : (
                         <Star className={`h-5 w-5 ${watchlisted.includes(stock.symbol) ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                      )}
                    </button>
                  </li>
              ))}
            </ul>
          )
          }
        </CommandList>
      </CommandDialog>
    </>
  )
}