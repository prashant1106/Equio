import { getNews } from "@/lib/actions/finnhub.actions";
import Link from "next/link";
import { ExternalLink, Clock } from "lucide-react";

export default async function NewsPage() {
  const news = await getNews();

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end">
        <h1 className="text-3xl font-bold tracking-tight text-white">Market News</h1>
      </div>
      
      {news.length === 0 ? (
        <div className="text-center py-20 border border-neutral-800 rounded-xl bg-neutral-900/50">
          <p className="text-gray-400">No market news available at the moment. Please check back later.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {news.map((article: any, index: number) => (
            <a 
              key={index}
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col justify-between border border-neutral-800 rounded-xl overflow-hidden bg-neutral-900/50 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/5"
            >
              {article.image && (
                <div className="w-full h-48 overflow-hidden">
                  <img 
                    src={article.image} 
                    alt={article.headline} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-semibold px-2 py-1 rounded bg-neutral-800 text-yellow-500">
                    {article.source}
                  </span>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(article.datetime)}
                  </div>
                </div>
                {article.related && (
                  <div className="mb-2">
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                       {article.related}
                    </span>
                  </div>
                )}
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-yellow-500 transition-colors line-clamp-2">
                  {article.headline}
                </h3>
                <p className="text-sm text-gray-400 line-clamp-3 flex-1 mb-4">
                  {article.summary}
                </p>
                <div className="flex items-center text-yellow-500 text-sm font-medium mt-auto group-hover:underline">
                  Read full article
                  <ExternalLink className="ml-1 h-4 w-4" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
