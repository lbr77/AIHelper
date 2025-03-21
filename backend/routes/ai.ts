import 'dotenv/config'
import { generateText, streamText } from 'ai'
import {Request, Response} from 'express'   
import { db } from '../db.ts'
import { createOpenAI } from '@ai-sdk/openai'
import { load } from 'cheerio'
const BATCH_SIZE = 3
const MAX_CONTENT_LENGTH = 10000
let summarizeSuffix = 'Summarize the following news:\n${content}'
export async function summarizeNews(req?: Request, res?: Response) {
	const news = await db.news.findMany({
		where: { summary: { equals: null } },
		take: BATCH_SIZE,
		orderBy: [
			{
				createdAt: 'desc',
			},
		],
	})
	await Promise.all(
		news.map(async item => {
			await db.news.update({
				where: { id: item.id },
				data: { summary: '' },
			})
			const url = new URL(item.url)
			if (['.pdf', '.zip'].find(suff => url.pathname.endsWith(suff))) {
				return db.news.update({
					where: { id: item.id },
					data: {
						summary:
							'File link found, should be implemented later.',
					},
				})
			}
			const res = await fetch(item.url, {
				headers: {
					accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
					'accept-language': 'zh-CN,zh;q=0.9,zh-TW;q=0.8',
					'cache-control': 'no-cache',
					pragma: 'no-cache',
					priority: 'u=0, i',
					'sec-ch-ua':
						'"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
					'sec-ch-ua-mobile': '?0',
					'sec-ch-ua-platform': '"macOS"',
					'sec-fetch-dest': 'document',
					'sec-fetch-mode': 'navigate',
					'sec-fetch-site': 'none',
					'sec-fetch-user': '?1',
					'sec-gpc': '1',
					'upgrade-insecure-requests': '1',
					referer: item.url,
					'referer-policy': 'strict-origin-when-cross-origin',
					'user-agent':
						'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
				},
				body: null,
				method: 'GET',
			}).then(res => res.text())
			const $ = load(res)
			;[
				'script',
				'style',
				'link',
				'img',
				'video',
				'iframe',
				'noscript',
				'audio',
				'nav',
				'footer',
				'header',
				'figure',
				'form',
				'embed',
				'input',
				'select',
				'picture',
				'search',
				'template',
			].forEach(tag => $(tag).remove())
			const title = $('title').text()
			const body = $('body').text()
			if (
				title.includes('Just a moment') ||
				body.startsWith('Just a moment')
			) {
				// if we need to use puppeteer to bypass cloudflare?
				await db.news.update({
					where: { id: item.id },
					data: {
						summary:
							'Cloudflare waiting page found, should be implemented later.',
					},
				})
				throw new Error('got cloudflare waiting page')
			}
			const content = `${title}\n${body}`
				.replace(/\s*\n\s*/g, '\n')
				.slice(0, MAX_CONTENT_LENGTH)
			const data = await AI(content)
			if (
				(data.includes(title) || title.includes(data)) &&
				data.length - title.length < 10
			) {
				throw new Error('Summarize is similar to title, skip')
			}
			if (data.length < 50) {
				throw new Error('Summarize is too short, skip')
			}
			await db.news.update({
				where: { id: item.id },
				data: { summary: data },
			})
			console.log(`Summarized ${item.title}`)
		}),
	).catch(err => {
		console.error(err)
	})
	if (res) {
		return res.json({ message: `Summarized ${news.length} news` })
	}
}
export async function summarizeSettings(req: Request, res: Response): Promise<Response> {
	if (req.body) {
		const { suffix } = req.body
		if (suffix) {
			summarizeSuffix = suffix
		}
	}
	return res.json({
		message: `Updated settings`,
		suffix: summarizeSuffix,
	})
}

export async function chat(req: Request, res: Response): Promise<Response> {
	if (!req.body) {
		return res.status(400).json({ error: 'Request body is missing' })
	}

	const messages = req.body.messages
	if (!messages || !Array.isArray(messages)) {
		return res.status(400).json({ error: 'Messages are required' })
	}
    const openai = createOpenAI({
		baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
		apiKey: process.env.OPENAI_API_KEY,
		compatibility: 'compatible',
	})
    const model = process.env.OPENAI_MODEL_ID || 'gpt-3.5-turbo'
    const result = streamText({
        model: openai(model),
        messages,
    })
	// return result.toDataStreamResponse();
    result.pipeDataStreamToResponse(res);
	return res;
}
export async function cronSummarizeNews() {
	const totalCount = await db.news.count()
	let currentCount = await db.news.count({
		where: { summary: { equals: null } },
	})
	if (currentCount === 0) {
		return
	}
	console.log(`Summarizing ${currentCount}/${totalCount} news`)
	while (currentCount > 0) {
		await summarizeNews()
		currentCount -= BATCH_SIZE
	}
}
async function AI(content: string) {
	const openai = createOpenAI({
		baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com',
		apiKey: process.env.OPENAI_API_KEY,
		compatibility: 'compatible',
	})
	const model = process.env.OPENAI_MODEL_ID || 'gpt-3.5-turbo'
	// console.log(`Using model: ${model}`);
	const { text } = await generateText({
		model: openai(model),
		prompt: summarizeSuffix.replace('${content}', content),
	})
	return text
}
