import express from 'express';
import { handleState } from './state-handlers';

const PORT = process.env.PORT || '3000';

const app = express();

app.get('/', async (req, res) => {
  const input: string|undefined = req.query.input;
  const state: string|undefined = req.query.state;
  const response = await handleState(input || '', state);
  res.send(response);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}.`);
});
