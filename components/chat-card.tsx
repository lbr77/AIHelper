'use client'

import { Send, Trash2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip'
import { useEffect, useRef } from 'react'
import { useToast } from '@/hooks/use-toast'

interface NewsItem {
	id: string
	createdAt: string
	url: string
	title: string
	summary: string
}
interface ChatCard {
	news: NewsItem
}
export default function ChatCard({ news }: ChatCard) {
	const { toast } = useToast()
	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		status,
		setMessages,
	} = useChat({
		initialMessages: [
			{
				id: '1',
				role: 'system',
				content:
					'You are a news commenter. You are supposed to answer the questions provided by user. And also when necessary, you can use tools like search engine or web scraper to find the answer.\nNow I will provide a news summary for you to comment on.\n News Title: ' +
					news.title +
					'News Summary: ' +
					news.summary,
			},
		],
		api: '/api/chat',
		streamProtocol: 'data',
		onError: err => {
			toast({
				title: 'Chat Error',
				description: err.message || 'Something went wrong',
				variant: 'destructive',
			})
		},
		onToolCall: ({ toolCall }) => {
			console.log(toolCall) // TODO: Maybe tool calling for this agent?  Will be implemented in future?
		},
	});
	const messagesEndRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		// auto scroll
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({
				behavior: 'smooth',
			})
		}
	}, [messages])
	const clearChat = () => {
		setMessages([])
	}
	const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault()
		if (!input.trim()) return
		handleSubmit(e)
	}
	return (
		<Card className='w-full max-w-2xl shadow-lg'>
			<CardHeader className='border-b'>
				<div className='flex items-center justify-between'>
					<CardTitle className='flex items-center gap-2'>
						Ask me anything!
					</CardTitle>
					<div className='flex gap-2'>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant='outline'
										size='icon'
										onClick={clearChat}
										disabled={messages.length === 0}
									>
										<Trash2 className='h-4 w-4' />
										<span className='sr-only'>
											Clear Chat
										</span>
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Clear Chat</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			</CardHeader>
			<CardContent className='overflow-y-auto p-2'>
				<div className='flex h-full items-center justify-center text-center'>
					<div className='space-y-1'>
						<Link href={news.url}>
							<h3 className='text-lg font-medium hover:underline'>
								{news.title}
							</h3>
						</Link>
					</div>
				</div>
			</CardContent>
			<div className='h-px bg-border' />
			<CardContent className='h-[60vh] overflow-y-auto p-4'>
				{messages.filter(message => message.role != 'system').length ==
				0 ? (
					<div className='flex h-full items-center justify-center text-center'>
						<div className='space-y-2'>
							<h3 className='text-lg font-medium'>
								Welcome to use the chatbot!
							</h3>
							<p className='text-sm text-muted-foreground'>
								Input message to start the conversation.
							</p>
						</div>
					</div>
				) : (
					<div className='space-y-4'>
						{messages.map(message => {
							if (message.role != 'system') {
								return (
									<div
										key={message.id}
										className={`flex ${
											message.role === 'user'
												? 'justify-end'
												: 'justify-start'
										}`}
									>
										<div
											className={`flex gap-3 max-w-[80%] ${
												message.role === 'user'
													? 'flex-row-reverse'
													: ''
											}`}
										>
											<div
												className={`rounded-lg p-3 text-sm ${
													message.role === 'user'
														? 'bg-primary text-primary-foreground'
														: 'bg-muted'
												}`}
											>
												<ReactMarkdown>{message.content}</ReactMarkdown>
											</div>
										</div>
									</div>
								)
							} else {
								return null
							}
						})}
						<div ref={messagesEndRef} />
					</div>
				)}
			</CardContent>
			<CardFooter className='border-t p-4'>
				<form
					onSubmit={handleFormSubmit}
					className='flex w-full space-x-2'
				>
					<Input
						value={input}
						onChange={handleInputChange}
						placeholder='Ask me anything...'
						className='flex-grow'
						disabled={status == 'streaming'}
					/>
					<Button
						type='submit'
						disabled={status == 'streaming' || !input.trim()}
					>
						<Send className='h-4 w-4' />
						<span className='sr-only'>Send</span>
					</Button>
				</form>
			</CardFooter>
		</Card>
	)
}
