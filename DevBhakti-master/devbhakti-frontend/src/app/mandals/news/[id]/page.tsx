"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Newspaper } from "lucide-react";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { API_URL } from "@/config/apiConfig";

type MandalNewsItem = {
  id: string;
  title: string;
  description?: string;
  festival?: string;
  mandalName?: string;
  publishedAt?: string;
  createdAt?: string;
};

export default function MandalNewsDetailPage() {
  const params = useParams<{ id: string }>();
  const [newsItem, setNewsItem] = useState<MandalNewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNewsDetail = async () => {
      try {
        const response = await fetch(`${API_URL}/mandal-news/${params.id}`);
        const data = await response.json();
        if (data?.success) {
          setNewsItem(data.data);
        }
      } catch (error) {
        console.error("Error loading mandal news detail:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadNewsDetail();
    }
  }, [params.id]);

  const formatNewsDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-zinc-900 flex flex-col justify-between">
      <Navbar isSolid={true} />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 pt-28 pb-14">
        <Link
          href="/mandals"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-[#6B0F1A] mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Mandals
        </Link>

        <article className="bg-white border border-zinc-200/80 rounded-3xl p-5 md:p-8 shadow-sm">
          {loading ? (
            <div className="py-16 text-center text-sm text-zinc-500">Loading news...</div>
          ) : !newsItem ? (
            <div className="py-16 text-center">
              <Newspaper className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <h1 className="text-xl font-serif font-bold text-zinc-900">News not found</h1>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B0F1A] mb-3">
                <Newspaper className="w-4 h-4" />
                News Update
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-zinc-950 leading-tight">
                {newsItem.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatNewsDate(newsItem.publishedAt || newsItem.createdAt)}
                </span>
                {newsItem.mandalName && <span>{newsItem.mandalName}</span>}
                {newsItem.festival && <span>{newsItem.festival}</span>}
              </div>
              <div
                className="prose prose-zinc max-w-none mt-8 text-zinc-700 prose-headings:font-serif prose-a:text-[#6B0F1A]"
                dangerouslySetInnerHTML={{ __html: newsItem.description || "" }}
              />
            </>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
}
