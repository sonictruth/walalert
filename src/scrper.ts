import fetch from 'node-fetch';

export default class Scraper {
  searchURLs: string[] = [];

  constructor(searchURLs: string[]) {
    this.searchURLs = searchURLs;
  }

  async run(delay = 5000): Promise<string[]> {
    const promises = this.searchURLs.map(async (url) => {
      const result = await Scraper.request(url);
      console.log('.');
      await new Promise(f => setTimeout(f, delay));
      console.log(url);
      return result;
    });
    const results = await Promise.all(promises);
    console.log(results);
    return [];
  }

  static async request(url: string): Promise<string[]> {
    return ['1', '2', '3'];
  }

  static log(msg: any) {
    console.log(msg);
  }
}
