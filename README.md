# Hacker News Summarize

## Usage: 

```bash
git clone ...
cd ...
docker build -t hn_summarize .
docker run -itd -p 3000:3000 hn_summarize
```

## Design

backend:

/grab-news: Used for grabbing news from [Hackernews API](https://github.com/HackerNews/API)

/summarize-news: Used for summarizing news using a simple prompt and the model you defined.

/api/chat: a simple redirector for chat requests.


frontend:

/: index page, listing news.

/chat/:slug: chat page, with context of the news.