import fetch, { Response } from 'node-fetch';
import Index from './Index';

jest.mock('node-fetch');

const notificationsServerURL = 'testserver';

const mockItem = (id: string, title = 'empty'): Item => ({
  id,
  title,
  description: id,
  images: [],
});

describe('Just a suite', () => {
  let index: Index;
  let mockedData: any;
  let notifications: any;
  const url1 = 'http://url1?keywords=somethin1&test=test';
  const url2 = 'http://url2?keywords=somethin2&test=test';
  beforeEach(async () => {
    mockedData = {};
    notifications = [];
    jest.mocked(fetch).mockImplementation(async (url, init) => {
      if (url === notificationsServerURL) {
        notifications.push(init);
      }
      const response = new Response();
      response.json = () => Promise.resolve(mockedData[<string>url]);
      return response;
    });
    process.env = {
      NODE_ENV: 'test',
      WA_NTFY_TOPIC: 'testtopic',
      WA_NTFY_SERVER: notificationsServerURL,
      WA_INTERVAL: '10',
      WA_DELAY: '20',
      WA_SRCH1: url1,
      WA_SRCH2: url2,
      WA_IGNORED_KEYWORDS:
        'bolsa para,grafica,monitor,torre,sobremesa,eee,raspberry,chromebook,mochila para,maletin de,funda de,funda por,gaming',
    };
    index = new Index();
  });
  it('should init', async () => {
    expect(index).not.toBeUndefined();
    expect(index.intervalMs).toBe(10);
    expect(index.delayBetweenRequestsMs).toBe(20);
    expect(index.searchURLs.length).toBe(2);
    index.init();
  });
  it('should normalize string', async () => {
    expect(Index.normalizeString('áéíñóúü')).toBe('aeinouu');
    expect(Index.normalizeString('ABC')).toBe('abc');
    expect(Index.normalizeString(' X ')).toBe('x');
  });
  it('should includes any keywords locale', async () => {
    expect(Index.includesAnyKewordsLocale('maletá', ['maleta'])).toBe(true);
    expect(Index.includesAnyKewordsLocale('monitor', ['no'])).toBe(false);
  });

  it('should send notifications for new items', async () => {
    mockedData[url1] = {
      search_objects: [mockItem('id1', 'title')],
    };
    mockedData[url2] = {
      search_objects: [mockItem('id2')],
    };
    expect(index.lastRunItems.length).toBe(0);
    await index.main();
    expect(index.lastRunItems.length).toBe(2);
    expect(notifications.length).toBe(2);
  });

  it('should not send notifications if title contains ignored keyword', async () => {
    mockedData[url1] = {
      search_objects: [mockItem('id1', 'con maletín de con')],
    };
    mockedData[url2] = {
      search_objects: [mockItem('id2', 'ok title')],
    };
    expect(index.lastRunItems.length).toBe(0);
    await index.main();
    expect(index.lastRunItems.length).toBe(2);
    expect(notifications.length).toBe(1);
    expect(notifications[0].body).toContain('ok title');
  });

  it('should remove duplicates', async () => {
    mockedData[url1] = {
      search_objects: [mockItem('duplicate'), mockItem('id1')],
    };
    mockedData[url2] = {
      search_objects: [mockItem('duplicate'), mockItem('id2')],
    };
    expect(index.lastRunItems.length).toBe(0);
    await index.main();
    expect(index.lastRunItems.length).toBe(3);

    mockedData[url1].search_objects.push(mockItem('newitem1'));
    mockedData[url2].search_objects.push(mockItem('newitem2'));
    await index.main();
    expect(index.lastRunItems.length).toBe(5);
  });
});
