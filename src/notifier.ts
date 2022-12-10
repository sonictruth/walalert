import fetch from 'node-fetch';

export default class Notifier {
  server: string;

  topic: string;

  constructor(ntfyServer: string, ntfyTopic: string) {
    this.server = ntfyServer;
    this.topic = ntfyTopic;
  }

  async notify(
    title: string,
    message: string,
    url = '',
    imageURL = '',
  ) {
    const params: any = {
      topic: this.topic,
      title,
      message,
      attach: imageURL,
      click: url,
      filename: 'message.jpg',
    };
    await fetch(`${this.server}`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}
