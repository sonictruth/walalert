import 'dotenv/config';
import Scraper from './scrper';
import Notifier from './notifier';

const main = async () => {
  const notifier = new Notifier(
    process.env.NTFY_SERVER as string,
    process.env.NTFY_TOPIC as string,
  );

  const searchURLs = Object.keys(process.env)
    .filter((env: string) => env.startsWith('WA_SRCH'))
    .map((key) => process.env[key] as string);

  const scraper = new Scraper(searchURLs);

  const results = await scraper.run();

};

main();
