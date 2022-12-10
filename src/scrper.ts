import fetch from 'node-fetch';

export default class Scraper {
  searchURLs: string[] = [];

  runCount = 0;

  constructor(searchURLs: string[]) {
    this.searchURLs = searchURLs;
  }

  async run(delay: number): Promise<any[]> {
    let results:string[] = [];
    await this.searchURLs.reduce(
      (promise, url) => promise.then(async () => {
        await new Promise((f) => setTimeout(f, delay));
        try {
          const result = await this.request(url);
          results = [...results, ...result];
        } catch (error) {
          console.error(error);
        }
        return [];
      }),
      Promise.resolve([] as any[]),
    );
    this.runCount += 1;
    return results;
  }

  async request(url: string): Promise<any[]> {
    console.log('Scrape run count:', this.runCount);
    const response = await fetch(url);
    const data = await response.json();
    return data.search_objects;
  }

  static log(msg: any) {
    console.log(msg);
  }
}
