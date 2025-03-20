'use client'

import Link from 'next/link'
import { Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'

interface NewsItem {
	id: string
	createdAt: string
	url: string
	title: string
	summary: string
}

export default function NewsPage() {
	const [newsList, setNewsList] = useState<Array<NewsItem>>([])
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(false)
	const fetchNews = async (page: number) => {
		setLoading(true)
		await fetch('/get-news?page=' + page)
			.then(res => res.json())
			.then(data => {
				setNewsList(newsList => [...newsList, ...data.list])
				if (data.list.length > 0) {
					setPage(page + 1)
				}
				setLoading(false)
			})
	}
	const grabNews = async () => {
		setLoading(true)
		await fetch('/grab-news')
			.then(res => res.json())
			.then(data => {
				console.log(data)
			})
	}
	const summaryNews = async () => {
		setLoading(true)
		await fetch('/summarize-news')
			.then(res => res.json())
			.then(data => {
				console.log(data)
			})
	}
	// onMount
	useEffect(() => {
		fetchNews(page)
	}, [])

	return (
		<div className='min-h-screen bg-background'>
			<header className='sticky top-0 z-40 w-full border-b bg-background'>
				<div className='flex h-16 items-center justify-between py-4 w-full'>
					<div className='flex items-center gap-2'>
						<Link href='/' className='font-bold text-2xl ml-3'>
							Hackernews Summary
						</Link>
					</div>
					<div className='flex gap-2 items-center px-5'>
						<Button
							variant='outline'
							onClick={async () => {
								setLoading(true)
								setNewsList([])
								setPage(1)
								await grabNews()
									.then(() => summaryNews())
									.then(() => fetchNews(1))
									.catch(err => {
										toast({
											title: 'Error',
											description: err.message,
											variant: 'destructive',
										})
									})
							}}
						>
							Refresh Contents
						</Button>
					</div>
				</div>
			</header>
			<main className='py-6 md:py-8'>
				<div className='container max-w-4xl px-4 sm:px-6 mx-auto'>
					<div className='grid gap-6'>
						{newsList.map((news, index) => (
							<NewsItem key={index} news={news} />
						))}
					</div>
					<div className='flex justify-center mt-8'>
						<Button
							variant='outline'
							onClick={() => {
								fetchNews(page)
							}}
							disabled={loading}
						>
							{loading ? (
								<>
									<svg
										className='animate-spin -ml-1 mr-3 h-5 w-5 text-current'
										xmlns='http://www.w3.org/2000/svg'
										fill='none'
										viewBox='0 0 24 24'
									>
										<circle
											className='opacity-25'
											cx='12'
											cy='12'
											r='10'
											stroke='currentColor'
											strokeWidth='4'
										></circle>
										<path
											className='opacity-75'
											fill='currentColor'
											d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
										></path>
									</svg>
									加载中...
								</>
							) : (
								'加载更多'
							)}
						</Button>
					</div>
				</div>
			</main>
			<footer className='left-0 right-0 border-t bg-background py-6 md:py-8'>
				<div className='container max-w-4xl px-4 sm:px-6 flex flex-col items-center justify-between gap-4 md:flex-row'>
					<p className='text-center text-sm text-muted-foreground md:text-left'>
						&copy; {new Date().getFullYear()} Hackernews. All rights
						reserved.
					</p>
					<div className='flex gap-4 justify-end'>
						<Link
							href='https://github.com'
							className='text-sm text-muted-foreground hover:underline'
						>
							Source code on Github
						</Link>
					</div>
				</div>
			</footer>
		</div>
	)
}

function NewsItem({ news }: { news: NewsItem }) {
	return (
		<div className='border-b pb-6'>
			<div className='flex items-center gap-2 mb-2'>
				<span className='text-xs text-muted-foreground flex items-center gap-1'>
					<Clock className='h-3 w-3' />
					{new Date(news.createdAt).toLocaleString()}
				</span>
				<Link
					className='hover:underline text-xs text-muted-foreground flex items-center gap-1'
					href={news.url}
				>
					news url
				</Link>
			</div>
			<h3 className='text-lg font-bold mb-2'>
				<Link
					href={`/chat/${news.id}`}
					className='hover:underline'
					target='_blank'
					aria-description='Chat for details'
				>
					{news.title}
				</Link>
			</h3>
			<p className='text-muted-foreground text-sm'>{news.summary}</p>
		</div>
	)
}
