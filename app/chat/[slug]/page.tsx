import ChatCard from '@/components/chat-card'
interface NewsItem {
	id: string
	createdAt: string
	url: string
	title: string
	summary: string
}

export default async function Chat({ params }: { params: Promise<{slug: string}>}) {
	const port = process.env.PORT || 3000;
	const { slug } = await params
	const news: NewsItem = await fetch(`http://localhost:${port}/get-news/${slug}`).then(res=>{
		if(res.status === 404) {
			return null;
		}
		return res.json();
	});
	if(!news) {
		return (
			<div className='flex items-center justify-center min-h-screen bg-background p-4'>
				<p className='text-muted-foreground'>News not found</p>
			</div>
		)
	}
	return (
		<div className='flex items-center justify-center min-h-screen bg-background p-4'>
			<ChatCard news={news} />
		</div>
	)
}
