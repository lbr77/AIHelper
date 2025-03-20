import { db } from "../db.ts"
import { Request, Response } from "express";
export interface NewsInfo {
    id: number;
    title: string;
    user: string;
    url: string;
    summary?: string;
}
export async function getNewsById(req: Request,res: Response) {
    const id = Number(req.params.id);
    const news = await db.news.findUnique({where: {id}});
    if(!news) {
        return res.status(404).json({message: "News not found"});
    }
    return res.json(news);
}

export async function grabNews(req?: Request,res?: Response) {
    const newsIds: number[] = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty").then(res=>res.json())
    const storedNewsList = await db.news.findMany({
        where: { id: { in: newsIds } },
        select: {id: true}
    });
    const existId = storedNewsList.reduce((map,item) => {
        map[item.id] = true;
        return map;
    }, {} as {[key: number]: boolean});
    const needsGrab = newsIds.filter(id => !existId[id]);
    await Promise.all(needsGrab.map(async id => {
        const news = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json?print=pretty`).then(res=>res.json());
        if(news.type !== "story" || !news.id) return;
        console.log(`News: ${news.title} by @${news.by}`);
        await db.news.create({data: {
            id: news.id,
            user: news.by || "",
            title: news.title || "",
            url: news.url || `https://news.ycombinator.com/item?id=${news.id}`,
        }})
    }));
    console.log(`Grabbing ${needsGrab.length} news`);
    if(res) {
        return res.json({message: `Grabbed news`});
    }
}
export async function getNewsList(req: Request,res: Response) {
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 5;
    const newsList = await db.news.findMany({
        skip: (page - 1) * size,
        take: size,
        orderBy: {createdAt: "desc"},
        where: { AND: [{summary: { not: null }},{summary: { not: "" }}] },
    });
    const count = await db.news.count({
        where: { AND: [{summary: { not: null }},{summary: { not: "" }}] }
    });
    return res.json({list: newsList, count});
}