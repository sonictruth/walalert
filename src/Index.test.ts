import fetch, { Response } from 'node-fetch';
import Index from './Index';

jest.mock('node-fetch');

const mockItem = (id: string): Item => ({
  id,
  title: id,
  description: id,
  images: [],
});

describe('Just a suite', () => {
  let index: Index;
  beforeAll(async () => {
    process.env = {
      NODE_ENV: 'test',
      WA_NTFY_TOPIC: 'testtopic',
      WA_NTFY_SERVER: 'testserver',
      WA_INTERVAL: '10',
      WA_DELAY: '20',
      WA_SRCH1: 'url1',
      WA_SRCH2: 'url2',
    };
    index = new Index();
  });
  it('Test ENV variables', async () => {
    expect(index).not.toBeUndefined();
    expect(index.intervalMs).toBe(10);
    expect(index.delayBetweenRequestsMs).toBe(20);
    expect(index.searchURLs.length).toBe(2);
  });
  it('Test', async () => {
    let mockedData: any = [];
    let notifications: any = [];
    jest.mocked(fetch).mockImplementation(async (url, init) => {
      if (url === 'testserver') {
        notifications.push(init);
      }
      const response = new Response();
      const key = <string>url;
      response.json = () => Promise.resolve(mockedData[key]);
      return response;
    });
    mockedData = {
      url1: {
        search_objects: [mockItem('duplicate'), mockItem('id1')],
      },
      url2: {
        search_objects: [mockItem('duplicate'), mockItem('id2')],
      },
    };
    await index.main();
    expect(index.lastRunItems.length).toBe(3);

    mockedData.url1.search_objects.push(mockItem('newitem1'));
    mockedData.url2.search_objects.push(mockItem('newitem2'));

    notifications = [];
    await index.main();
    expect(index.lastRunItems.length).toBe(5);
    expect(notifications.length).toBe(2);
  });
});
