import express from 'express';

type ConversationStatus = "end"|"continue";

type TextitResponse = {
  text: string,
  conversationStatus: ConversationStatus,
};

const PORT = process.env.PORT || '3000';

const app = express();

app.get('/', (req, res) => {
  const input: string|undefined = req.query.input;
  let text: string;
  let conversationStatus: ConversationStatus = "continue";

  if (input && typeof(input === "string")) {
    if (input === "bye") {
      text = "Okay, bye.";
      conversationStatus = "end";
    } else {
      text = `Well ${input} to you too.`;
    }
  } else {
    text = "Welcome, buddy!";
  }

  const response: TextitResponse = {text, conversationStatus};
  res.send(response);
});

app.listen(PORT, () => {
  console.log(`listening on port ${PORT}.`);
});
