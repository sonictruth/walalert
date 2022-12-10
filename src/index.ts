import 'dotenv/config';
import Scraper from './scrper';
import Notifier from './notifier';

let lastRunItems:any[] = [];

const notifier = new Notifier(
  process.env.WA_NTFY_SERVER as string,
  process.env.WA_NTFY_TOPIC as string,
);

const delay = parseInt(process.env.WA_DELAY as string, 10);

const interval = parseInt(process.env.WA_INTERVAL as string, 10);

const searchURLs = Object.keys(process.env)
  .filter((env: string) => env.startsWith('WA_SRCH'))
  .map((key) => process.env[key] as string);

const scraper = new Scraper(searchURLs);

const notifyItem = async (item:any) => {
  const url = `https://es.wallapop.com/item/${item.web_slug}`;
  const imageURL = item.images[0].small;
  const body = `
Price: ${item.price} Location: ${item.location.city}
${item.shipping.item_is_shippable ? 'Shippable' : 'Not shippable'}
${item.supports_shipping ? 'Supports shipping' : ''}
${item.description}`;

  return notifier.notify(item.title, body, url, imageURL);
};

const main = async () => {
  const results = await scraper.run(delay);
  if (lastRunItems.length === 0) {
    console.log('First run:', results.length);
    notifyItem(results[0]);
  } else {
    const newItems = results.filter((item) => !lastRunItems.some(
      (lastItem) => lastItem.id === item.id,
    ));

    await newItems.reduce(
      (promise, item) => promise.then(async () => {
        try {
          await notifyItem(item);
        } catch (error) {
          console.error(error);
        }
      }),
      Promise.resolve([] as any[]),
    );
  }
  lastRunItems = results;

  await new Promise((f) => setTimeout(f, interval));
  main();
};

main();
