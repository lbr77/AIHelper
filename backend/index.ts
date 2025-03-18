import express from "express";
import cors from "cors";
import { getNewsList,grabNews } from "./routes/fetch";
import { summarizeNews,cronSummarizeNews,summarizeSettings } from "./routes/ai";
import next from "next";
import path from "path";
const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev, dir: path.join(__dirname, "../") });
const nextHandler = nextApp.getRequestHandler();

import cron from "node-cron";
nextApp.prepare().then(() => {

    const app = express();
    app.use(cors({
        origin: "*",
        maxAge: 60 * 60 * 24
    }));
    (async() => {await cronSummarizeNews();})();

    app.use("/_next",express.static(path.join(__dirname,"../.next")));
    app.get("/get-news",getNewsList);
    app.get("/grab-news",grabNews);
    app.get("/summarize-news",summarizeNews);
    app.post("/summarize-setting",summarizeSettings);
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Server is running on http://localhost:${port}`);
    });

    app.use('*',(req,res) => {
        return nextHandler(req,res);
    });
}).catch(err => {
    console.error(err);
}) 
cron.schedule('0 * * * *', async () => { // run every hour
    console.log('Running cron fetch job');
    await grabNews(null,null);
});
cron.schedule('0 * * * *', async () => { // run every hour
    console.log('Running cron summarize job');
    await cronSummarizeNews();
}); 