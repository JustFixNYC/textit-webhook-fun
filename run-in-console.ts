import { ConsoleIO } from "./console-io";
import { handleState } from "./state-handlers";
import { ConversationResponse, ConversationStatus } from "./conversation";

async function main() {
  const io = new ConsoleIO();
  let state = '';
  let input = '';
  let ended = false;

  while (!ended) {
    const response: ConversationResponse = await handleState(input, state);
    state = response.state;
    io.writeLine(response.text);
    if (response.conversationStatus === ConversationStatus.End) {
      ended = true;
    } else if (response.conversationStatus === ConversationStatus.Loop) {
      // Do nothing, just loop.
    } else if (response.conversationStatus === ConversationStatus.Ask) {
      input = await io.question('> ');
    }
  }

  io.close();
}

if (module.parent === null) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
