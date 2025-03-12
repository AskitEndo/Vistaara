import { NextApiRequest, NextApiResponse } from 'next';

let messages: { id: number; content: string; timestamp: number }[] = [];
let idCounter = 0;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json(messages);
  } else if (req.method === 'POST') {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const newMessage = { id: idCounter++, content, timestamp: Date.now() };
    messages.push(newMessage);

    // Automatically remove the message after 30 seconds
    setTimeout(() => {
      messages = messages.filter((msg) => msg.id !== newMessage.id);
    }, 30000);

    res.status(201).json(newMessage);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}