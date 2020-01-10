import express from 'express';
import { handleConversation } from '../conversation-handlers';

const PORT = process.env.PORT || '3000';

const app = express();

app.get('/', async (req, res) => {
  const input: string|undefined = req.query.input;
  const state: string|undefined = req.query.state;
  const response = await handleConversation(input || '', state);
  res.send(response);
});

if (module.parent === null) {
  app.listen(PORT, () => {
    console.log(`listening on port ${PORT}.`);
  });
}
