import 'dotenv/config';
import Scraper from './Scraper';
import Notifier from './Notifier';

export default class Index {
  lastRunItems: Item[] = [];

  notifier = new Notifier(
    process.env.WA_NTFY_SERVER as string,
    process.env.WA_NTFY_TOPIC as string,
  );

  delayBetweenRequestsMs = parseInt(process.env.WA_DELAY as string, 10);

  intervalMs = parseInt(process.env.WA_INTERVAL as string, 10);

  searchURLs = Object.keys(process.env)
    .filter((env: string) => env.startsWith('WA_SRCH'))
    .map((key) => process.env[key] as string);

  scraper = new Scraper(this.searchURLs);

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

  async main() {
    const items = await this.scraper.run(this.delayBetweenRequestsMs);
    if (this.lastRunItems.length === 0) {
      console.log('Items: ', items.length);
    } else {
      const newItems = items.filter(
        (item) => !this.lastRunItems.some((lastItem) => lastItem.id === item.id),
      );

      await newItems.reduce(
        (promise, item) => promise.then(async () => {
          try {
            await this.notifyItem(item);
          } catch (error) {
            console.error(error);
          }
        }),
        Promise.resolve(),
      );
    }
    this.lastRunItems = items;
  }

  async loop() {
    await this.main();
    await new Promise((f) => setTimeout(f, this.intervalMs));
    this.loop();
  }
}

if (process.env.NODE_ENV !== 'test') {
  const index = new Index();
  index.loop();
}
