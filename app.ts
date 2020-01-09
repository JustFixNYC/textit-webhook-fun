import express from 'express';

type ConversationStatus = "end"|"continue";

type ConversationState = {
  counter: number,
};

type TextitResponse = {
  text: string,
  conversationStatus: ConversationStatus,
  state: string,
};

const PORT = process.env.PORT || '3000';

const app = express();

function parseState(value: string|undefined, defaultValue: ConversationState): ConversationState {
  if (!value) return defaultValue;

  try {
    return JSON.parse(value || '');
  } catch (e) {
    console.warn(`Received state that is not valid JSON, returning default value.`);
    return defaultValue;
  }
}

app.get('/', (req, res) => {
  const input: string|undefined = req.query.input;
  const state = parseState(req.query.state, {counter: 0});
  let text: string;
  let conversationStatus: ConversationStatus = "continue";

  if (input && typeof(input === "string")) {
    if (input === "bye") {
      text = "Okay, bye.";
      conversationStatus = "end";
    } else {
      text = `Well ${input} to you too (${state.counter}).`;
      state.counter++;
    }
  } else {
    text = "Welcome, buddy!";
  }

  const response: TextitResponse = {text, conversationStatus, state: JSON.stringify(state)};
  res.send(response);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}.`);
});
