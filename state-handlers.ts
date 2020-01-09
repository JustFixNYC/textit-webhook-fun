import { TextitConversationStatus, TextitResponse } from "./textit";
import { geosearch, GeoSearchBoroughGid } from "./geosearch";

type StateHandlerName = (keyof StateHandlers)|'END';

type State = {
  handlerName: StateHandlerName,
  boroughGid?: GeoSearchBoroughGid,
  zip?: string,
  bbl?: string,
};

type StateHandler = (state: State, input: string) => TextitResponse|Promise<TextitResponse>;

class StateHandlers {
  intro1: StateHandler = s => {
    return say(s, [
      `Right to Counsel is a new law in NYC that provides free legal representation for eligible tenants. You may qualify based on:`,
      `- where you live in NYC`,
      `- income and household size`,
      `- your eviction notice`,
    ], 'intro2');
  };

  intro2: StateHandler = s => {
    return ask(
      s,
      `Let's see if you have the right to a free attorney! To start, what is your address and borough? Example: 654 Park Place, Brooklyn`,
      'receiveContactAddress'
    );
  };

  receiveContactAddress: StateHandler = async (s, input) => {
    const results = await geosearch(input);
    if (!results.features.length) {
      return ask(
        s,
        `Hmm, we couldn't understand that address. Can you try being more specific?`,
        'receiveContactAddress'
      );
    }
    const props = results.features[0].properties;
    return ask(s, [
      `Is this your address?`,
      props.label,
      `Please reply with either Yes or No.`
    ], 'confirmAddress', {
      boroughGid: props.borough_gid,
      zip: props.postalcode,
      bbl: props.pad_bbl,
    });
  };

  confirmAddress: StateHandler = (s, input) => {
    if (input.toLowerCase().startsWith('y')) {
      return end(s, `TODO: Finish this! User's borough is ${s.boroughGid} and zip is ${s.zip}.`);
    } else if (input.toLowerCase().startsWith('n')) {
      return say(s, "Oops, let's try again!", 'intro2');
    } else {
      return ask(s, `Sorry, I didn't understand that. Please respond with Yes or No.`, 'confirmAddress');
    }
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

function response(s: State, text: string|string[], nextStateHandler: StateHandlerName, status: TextitConversationStatus, stateUpdates?: Partial<State>): TextitResponse {
  const nextState: State = {
    ...s,
    ...stateUpdates,
    handlerName: nextStateHandler,
  };

  if (Array.isArray(text)) {
    text = text.join('\n');
  }

  return {text, conversationStatus: status, state: JSON.stringify(nextState)};
}

function ask(s: State, text: string|string[], nextStateHandler: StateHandlerName, stateUpdates?: Partial<State>): TextitResponse {
  return response(s, text, nextStateHandler, 'ask', stateUpdates);
}

function say(s: State, text: string|string[], nextStateHandler: StateHandlerName, stateUpdates?: Partial<State>): TextitResponse {
  return response(s, text, nextStateHandler, 'loop', stateUpdates);
}

function end(s: State, text: string|string[]): TextitResponse {
  return response(s, text, 'END', 'end');
}
