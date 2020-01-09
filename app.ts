import express from 'express';
import { TextitConversationStatus, TextitResponse } from './textit';
import { handleState } from './state-handlers';

const PORT = process.env.PORT || '3000';

const app = express();

function parseState(value: string|undefined): Object|null {
  if (!value) return null;

  try {
    const result = JSON.parse(value);
    if (!(result && typeof(result) === 'object')) {
      console.warn(`Received state that is not an object.`);
      return null;
    }
    return result;
  } catch (e) {
    console.warn(`Received state that is not valid JSON.`);
    return null;
  }
}

app.get('/', async (req, res) => {
  const input: string|undefined = req.query.input;
  const state = parseState(req.query.state);
  const response = await handleState(input || '', state);
  res.send(response);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}.`);
});
