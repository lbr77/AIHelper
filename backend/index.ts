
import express from "express";
import cors from "cors";
import { getNewsList,grabNews,getNewsById } from "./routes/fetch.ts";
import { summarizeNews,cronSummarizeNews,summarizeSettings,chat } from "./routes/ai.ts";
import next from "next";
import path from "node:path";
const dev = process.env.NODE_ENV !== 'production';
const dir = import.meta.dirname || __dirname;
const nextApp = next({ dev, dir: path.join(dir, "../"),turbo: dev });
const nextHandler = nextApp.getRequestHandler();

import cron from "node-cron";
nextApp.prepare().then(async () => {

    const app = express();
    app.use(cors({
        origin: "*",
        maxAge: 60 * 60 * 24
    }));
    (async() => {await cronSummarizeNews();})();
    app.use((req,res,next) => {
        const start = Date.now();
        res.on("finish", () => {
            if(req.url.startsWith("/_next")) return;
            if(req.url.startsWith("/static")) return;
            if(req.url.startsWith("/__nextjs")) return;
            console.log(` ${req.method} ${req.url} ${res.statusCode} in ${Date.now() - start}ms`);
        });
        next();
    })
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use("/_next",express.static(path.join(dir,"../.next")));
    // app.use("/.next",express.static(path.join(dir,"../.next")));
    
    app.use("/get-news/:id",getNewsById);
    app.get("/get-news",getNewsList);
    app.get("/grab-news",grabNews);
    app.get("/summarize-news",summarizeNews);
    app.post("/api/chat",chat);
    app.post("/summarize-setting",summarizeSettings);
    app.all('*',(req,res) => {
        return nextHandler(req,res);
    });
    const port = process.env.PORT || 3000;
    try{
        app.listen(port, () => {
            console.log(`${dev ? "Development" : "Production"} server is running on http://localhost:${port}`);
        });
        await grabNews();
        await cronSummarizeNews();
        
        cron.schedule('0 * * * *', async () => { // run every hour
            console.log('Running cron fetch job');
            await grabNews();
        });
        cron.schedule('0 * * * *', async () => { // run every hour
            console.log('Running cron summarize job');
            await cronSummarizeNews();
        }); 
    } catch(err) {
        console.error(err);
    }

});