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

const main = async () => {
  const results = await scraper.run(delay);
  if (lastRunItems.length === 0) {
    console.log('First run:', results.length);
  } else {
    const newItems = results.filter((item) => !lastRunItems.some(
      (lastItem) => lastItem.id === item.id,
    ));

    await newItems.reduce(
      (promise, item) => promise.then(async () => {
        try {
          notifier.notify(item.title, `
          Shipping: 
          ${item.shipping.item_is_shippable}
          ${item.supports_shipping}

          Price: ${item.price}
          Distance: ${item.location.city}
          `);
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
