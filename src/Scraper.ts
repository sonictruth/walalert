import fetch from 'node-fetch';

export default class Scraper {
  searchURLs: string[] = [];

  runCount = 0;

  constructor(searchURLs: string[]) {
    this.searchURLs = searchURLs;
  }

  async run(delay: number): Promise<Item[]> {
    console.log('Run:', this.runCount);
    const allItems:Item[] = [];
    await this.searchURLs.reduce(
      (promise, url) => promise.then(async () => {
        await new Promise((f) => setTimeout(f, delay));
        try {
          const currentRequestItems = await Scraper.request(url);
          currentRequestItems.forEach((currentItem) => {
            const isDuplicate = allItems.some((item) => item.id === currentItem.id);
            if (!isDuplicate) {
              allItems.push(currentItem);
            }
          });
        } catch (error) {
          console.error(error);
        }
      }),
      Promise.resolve(),
    );
    this.runCount += 1;
    return allItems;
  }

  static async request(url: string): Promise<Item[]> {
    const response = await fetch(url);
    const data = await response.json();
    return data.search_objects;
  }
}
