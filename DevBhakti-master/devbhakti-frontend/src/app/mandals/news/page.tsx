"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Newspaper } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { API_URL } from "@/config/apiConfig";
import { stripHtml } from "@/utils/textUtils";

type MandalNewsItem = {
  id: string;
  title: string;
  description?: string;
  publishedAt?: string;
  createdAt?: string;
};

export default function MandalNewsPage() {
  const [news, setNews] = useState<MandalNewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const response = await fetch(`${API_URL}/mandal-news`);
        const data = await response.json();
        if (data?.success) {
          setNews(data.data || []);
        }
      } catch (error) {
        console.error("Error loading mandal news:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNews();
  }, []);

  const formatNewsDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 flex flex-col justify-between">
      <Navbar isSolid={true} />
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 pt-28 pb-14">
        <Link
          href="/mandals"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-[#6B0F1A] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Mandals
        </Link>

        <div className="bg-white border border-zinc-200/80 rounded-3xl p-5 md:p-8 shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-full bg-red-50 border border-red-100 flex items-center justify-center text-red-700">
              <Newspaper className="w-5 h-5" />
            </div>
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-900">
              News Updates
            </h1>
          </div>

          <div className="divide-y divide-zinc-100">
            {loading ? (
              <div className="py-12 text-center text-sm text-zinc-500">Loading news...</div>
            ) : news.length === 0 ? (
              <div className="py-12 text-center text-sm text-zinc-500">
                No news updates available right now.
              </div>
            ) : (
              news.map((item) => (
                <Link
                  key={item.id}
                  href={`/mandals/news/${item.id}`}
                  className="group flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0 mt-2" />
                    <div className="min-w-0">
                      <h2 className="text-sm md:text-base font-bold text-zinc-800 group-hover:text-[#6B0F1A] transition-colors">
                        {item.title}
                      </h2>
                      <p className="text-sm text-zinc-500 line-clamp-1 mt-1">
                        {stripHtml(item.description || "") || "Read full news update"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="hidden sm:inline text-xs font-medium text-zinc-500">
                      {formatNewsDate(item.publishedAt || item.createdAt)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#6B0F1A] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
