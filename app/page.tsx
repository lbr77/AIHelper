"use client";

import Link from "next/link"
import { Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react";
export default function NewsPage() {
  //eslint-disable-next-line
  const [newsList,setNewsList] = useState<Array<any>>([]);
  const [page,setPage] = useState(1);
  const [loading,setLoading] = useState(false);
  const fetchNews = async (page: number) => {
    setLoading(true);
    fetch("http://localhost:3000/get-news?page="+page).then(res=>res.json()).then(data=>{
      setNewsList((newsList)=>[...newsList,...data.list]);
      if(data.list.length > 0) {

        setPage(page+1);
      }
      setLoading(false);
    })
  }
  useEffect(() => {
    fetchNews(page);
  },[])



  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-2xl ml-3">
              Hackernews Summary
            </Link>
          </div>
          <Button variant="outline" size="icon" className="md:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
            >
              <line x1="4" x2="20" y1="12" y2="12" />
              <line x1="4" x2="20" y1="6" y2="6" />
              <line x1="4" x2="20" y1="18" y2="18" />
            </svg>
          </Button>
        </div>
      </header>
      <main className="py-6 md:py-8">
        <div className="container max-w-4xl px-4 sm:px-6 mx-auto">
          <div className="grid gap-6">
            {newsList.map((news, index) => (
              <NewsItem key={index} news={news} />
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Button variant="outline" onClick={()=>{fetchNews(page);}} disabled={loading}>
              {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                加载中...
              </>
              ) : (
              "加载更多"
              )}
            </Button>
          </div>
        </div>
      </main>
      <footer className="left-0 right-0 border-t bg-background py-6 md:py-8">
        <div className="container max-w-4xl px-4 sm:px-6 flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground md:text-left">
        &copy; {new Date().getFullYear()} Hackernews. All rights reserved.
          </p>
          <div className="flex gap-4 justify-end">
            <Link href="https://github.com" className="text-sm text-muted-foreground hover:underline">
              Source code on Github
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
interface NewsItem {
  createdAt: string;
  url: string;
  title: string;
  summary: string;
}

function NewsItem({ news }: { news: NewsItem }) {
  return (
    <div className="border-b pb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {new Date(news.createdAt).toLocaleString()}
        </span>
      </div>
      <h3 className="text-lg font-bold mb-2">
        <Link href={news.url} className="hover:underline">
          {news.title}
        </Link>
      </h3>
      <p className="text-muted-foreground text-sm">{news.summary}</p>
    </div>
  )
}

