import { TextitConversationStatus, TextitResponse } from "./textit";

type StateHandlerName = (keyof StateHandlers)|'END';

type State = {
  handlerName: StateHandlerName,
};

type StateHandler = (state: State, input: string) => TextitResponse|Promise<TextitResponse>;

class StateHandlers {
  intro1: StateHandler = s => {
    return say([
      `Right to Counsel is a new law in NYC that provides free legal representation for eligible tenants. You may qualify based on:`,
      `- where you live in NYC`,
      `- income and household size`,
      `- your eviction notice`,
    ], 'intro2');
  };

  intro2: StateHandler = s => {
    return ask(
      `Let's see if you have the right to a free attorney! To start, what is your address and borough? Example: 654 Park Place, Brooklyn`,
      'receiveContactAddress'
    );
  };

  receiveContactAddress: StateHandler = async (s, input) => {
    return end(`TODO look up "${input}" in geosearch!`);
  };
}

const HANDLERS = new StateHandlers();

export async function handleState(input: string, deserializedState: Object|null): Promise<TextitResponse> {
  const state: State = (deserializedState as State) || {handlerName: 'intro1'};

  if (state.handlerName === 'END') {
    throw new Error('Assertion failure, current state handler is END!');
  }

  // TODO: state.handlerName is ultimately untrusted input, and this may be an insecure way
  // of testing whether the handler name is valid.
  const handler = HANDLERS[state.handlerName];

  if (typeof(handler) !== 'function') {
    throw new Error(`Assertion failure, "${state.handlerName}" is an invalid state handler name!`);
  }

  return handler(state, input);
};

function response(text: string|string[], nextStateHandler: StateHandlerName, status: TextitConversationStatus): TextitResponse {
  const nextState: State = {
    handlerName: nextStateHandler,
  };

  if (Array.isArray(text)) {
    text = text.join('\n');
  }

  return {text, conversationStatus: status, state: JSON.stringify(nextState)};
}

function ask(text: string|string[], nextStateHandler: StateHandlerName): TextitResponse {
  return response(text, nextStateHandler, 'ask');
}

function say(text: string|string[], nextStateHandler: StateHandlerName): TextitResponse {
  return response(text, nextStateHandler, 'loop');
}

function end(text: string|string[]): TextitResponse {
  return response(text, 'END', 'end');
}
