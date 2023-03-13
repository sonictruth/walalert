import 'dotenv/config';
import urlParser from 'url';
import querystringParser from 'querystring';
import Scraper from './Scraper';
import Notifier from './Notifier';

export default class Index {
  lastRunItems: Item[] = [];

  ignoredKeywords: string[] = [];

  searchURLs: string[] = [];

  delayBetweenRequestsMs: number;

  intervalMs: number;

  notifier: Notifier;

  scraper: Scraper;

  constructor() {
    this.delayBetweenRequestsMs =
      parseInt(process.env.WA_DELAY as string, 10) || 500;
    this.intervalMs = parseInt(process.env.WA_INTERVAL as string, 10) || 500;
    this.searchURLs = Object.keys(process.env)
      .filter((env: string) => env.startsWith('WA_SRCH'))
      .map((key) => process.env[key] as string);

    if (process.env.WA_IGNORED_KEYWORDS) {
      const keywords = process.env.WA_IGNORED_KEYWORDS;
      this.ignoredKeywords = keywords.split(',').map((keyword) => {
        const cleanKeyword = keyword.trim().toLowerCase();
        return cleanKeyword;
      });
    }

    this.notifier = new Notifier(
      process.env.WA_NTFY_SERVER as string,
      process.env.WA_NTFY_TOPIC as string,
    );
    this.scraper = new Scraper(this.searchURLs);
  }

  async notifyItem(item: Item) {
    const url = `https://es.wallapop.com/item/${item.web_slug}`;
    const imageURL = item.images.length === 0 ? '' : item.images[0].small;
    const body = `
  
  Price: ${item.price} Location: ${item.location?.city}
  ${item.shipping?.item_is_shippable ? 'Shippable' : 'Not shippable'}
  ${item.supports_shipping ? 'Supports shipping' : ''}
  ${item.description}`;

    return this.notifier.notify(item.title, body, url, imageURL);
  }

  async getItems(): Promise<Item[]> {
    return this.scraper.run(this.delayBetweenRequestsMs);
  }

  async init(): Promise<Item[]> {
    const searchInfo = this.searchURLs.map((url) => {
      const parsed = urlParser.parse(url);
      const query = querystringParser.parse(parsed.query || '');
      return {
        keywords: query.keywords,
        max: query.max_sale_price,
        order: query.order_by,
        categories: query.category_ids,
        subcategories: query.object_type_ids,
      };
    });
    console.table(searchInfo);
    console.log(`Ignored Keywords: ${this.ignoredKeywords.join(', ')}`);
    console.log(`Interval: ${this.intervalMs / 1000}s`);
    console.log(`Req delay: ${this.delayBetweenRequestsMs / 1000}s`);
    this.lastRunItems = await this.getItems();
    await new Promise((f) => setTimeout(f, this.intervalMs));
    return this.lastRunItems;
  }

  async main(isLoopyLoop = false) {
    const items = await this.getItems();

    const newItems = items
      .filter(
        (item) =>
          !this.lastRunItems.some((lastItem) => lastItem.id === item.id),
      )
      .filter(
        (item) =>
          !Index.includesAnyKewordsLocale(item.title, this.ignoredKeywords),
      );

    console.table(newItems.map((item) => item.title));

    await newItems.reduce(
      (promise, item) =>
        promise.then(async () => {
          try {
            await this.notifyItem(item);
          } catch (error) {
            console.error(error);
          }
        }),
      Promise.resolve(),
    );
    this.lastRunItems = items;
    if (isLoopyLoop) {
      await new Promise((f) => setTimeout(f, this.intervalMs));
      this.main(true);
    }
  }

  static normalizeString(string: string): string {
    return string
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  static includesAnyKewordsLocale(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => {
      const normalised = Index.normalizeString(text);
      return normalised.split(' ').some((titleText) => titleText.includes(keyword));
    });
  }
}

if (process.env.NODE_ENV !== 'test') {
  const index = new Index();
  index.init().then((initialItems) => {
    console.log(`Initial items count: ${initialItems.length}`);
    index.main(true);
  });
}
