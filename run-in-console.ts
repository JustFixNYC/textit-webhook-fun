import { ConsoleIO } from "./console-io";
import { handleState } from "./state-handlers";
import { TextitResponse } from "./textit";

async function main() {
  const io = new ConsoleIO();
  let state = '';
  let input = '';
  let ended = false;

  while (!ended) {
    const response: TextitResponse = await handleState(input, state);
    state = response.state;
    io.writeLine(response.text);
    if (response.conversationStatus === 'end') {
      ended = true;
    } else if (response.conversationStatus === 'loop') {
      // Do nothing, just loop.
    } else if (response.conversationStatus === 'ask') {
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
