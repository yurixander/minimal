import axios from "axios";
import * as os from "node:os";
import {
  HACKERNEWS_TOP_STORIES_ENDPOINT,
  SPLASH_NEWS_COUNT,
} from "../constants.js";
import LineBuffer from "../lineBuffer.js";
import { Command, CommandDef } from "../types.js";

interface NewsStory {
  id: number;
  title: string;
  url: string;
}

async function fetchDeveloperHeadlines(): Promise<string[]> {
  try {
    const { data: topStories } = await axios.get<number[]>(
      HACKERNEWS_TOP_STORIES_ENDPOINT
    );

    const storyHeadlines: string[] = [];

    for (let i = 0; i < SPLASH_NEWS_COUNT; i++) {
      // TODO: Use a method that prevents getting the same story twice, also consider abstracting this into an utility function.
      const randomStoryId =
        topStories[Math.floor(Math.random() * topStories.length)];

      // Fetch details for the random story
      const { data: story } = await axios.get<NewsStory>(
        `https://hacker-news.firebaseio.com/v0/item/${randomStoryId}.json`
      );

      storyHeadlines.push(story.title);
    }

    return storyHeadlines;
  } catch (error) {
    return [];
  }
}

const splash: Command = async () => {
  const username = os.userInfo().username;
  const response = new LineBuffer();
  const time = new Date().toLocaleTimeString();

  response.pushWithDefaults({
    text: `${username} is using minimal @ ${time}`,
    color: "white",
  });

  const newsHeadlines = await fetchDeveloperHeadlines();

  for (const headline of newsHeadlines) {
    response.pushListItem({
      text: headline,
    });
  }

  return [response];
};

export default {
  description: "Show the splash/welcome screen with quick glance information.",
  execute: splash,
} satisfies CommandDef;