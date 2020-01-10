import { ConversationStatus, ConversationResponse } from "./conversation";
import { geosearch, GeoSearchBoroughGid } from "./geosearch";
import { getNychaInfo } from "./nycha";
import { isRtcZipcode } from "./rtc-zipcodes";

const INVALID_YES_OR_NO = `Sorry, I didn't understand that. Please respond with Yes or No.`;

// These have meaning to the EFNYC site, please don't change them.
type EvictionType = 'nonpay'|'holdover'|'general';

type StateHandlerName = (keyof StateHandlers)|'END';

type RtcInfo = {
  boroughGid: GeoSearchBoroughGid,
  zip: string,
  bbl: string,
  isIncomeEligible: boolean,
  evictionType: EvictionType,
};

type State = Partial<RtcInfo> & {
  handlerName: StateHandlerName,
};

type StateHandler = (state: State, input: string) => ConversationResponse|Promise<ConversationResponse>;

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
    if (isYes(input)) {
      return ask(s, [
        `Your eligibility depends on your household size and annual income:`,
        ``,
        `Household Size / Annual Income`,
        `1 person / $24,120`,
        `2 people / $32,480`,
        `3 people / $40,840`,
        `4 people / $49,200`,
        `5 people / $57,560`,
        `6 people / $65,920`,
        ``,
        `Do you think you are income eligible? Please reply with either Yes or No.`
      ], 'receiveIncomeAnswer');
    } else if (isNo(input)) {
      return say(s, "Oops, let's try again!", 'intro2');
    } else {
      return ask(s, INVALID_YES_OR_NO, 'confirmAddress');
    }
  };

  receiveIncomeAnswer: StateHandler = (s, input) => {
    const isIncomeEligible = parseYesOrNo(input);

    if (isIncomeEligible === undefined) {
      return ask(s, INVALID_YES_OR_NO, 'receiveIncomeAnswer');
    }

    return ask(s, [
      `Last question: what type of eviction notice did you receive? Please answer Nonpayment, Holdover, or Other.`
    ], 'receiveEvictionType', {
      isIncomeEligible
    });
  };

  receiveEvictionType: StateHandler = (s, input) => {
    let evictionType: EvictionType;

    if (/non/i.test(input)) {
      evictionType = 'nonpay';
    } else if (/hold/i.test(input)) {
      evictionType = 'holdover';
    } else if (/other/i.test(input)) {
      evictionType = 'general';
    } else {
      return ask(s, 'Sorry, I didn\'t understand that. Please respond with Nonpayment, Holdover, or Other.', 'receiveEvictionType');
    }

    const help = getRtcHelp(ensureRtcInfo({ ...s, evictionType }));

    return end(s, [
      help.title,
      '',
      `Visit ${help.url} for next steps.`
    ]);
  };
}

const HANDLERS = new StateHandlers();

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

export async function handleState(input: string, serializedState?: string): Promise<ConversationResponse> {
  const deserializedState = parseState(serializedState);
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

function response(s: State, text: string|string[], nextStateHandler: StateHandlerName, status: ConversationStatus, stateUpdates?: Partial<State>): ConversationResponse {
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

function ask(s: State, text: string|string[], nextStateHandler: StateHandlerName, stateUpdates?: Partial<State>): ConversationResponse {
  return response(s, text, nextStateHandler, ConversationStatus.Ask, stateUpdates);
}

function say(s: State, text: string|string[], nextStateHandler: StateHandlerName, stateUpdates?: Partial<State>): ConversationResponse {
  return response(s, text, nextStateHandler, ConversationStatus.Loop, stateUpdates);
}

function end(s: State, text: string|string[]): ConversationResponse {
  return response(s, text, 'END', ConversationStatus.End);
}

function isYes(text: string): boolean {
  return text.toLowerCase().startsWith('y');
}

function isNo(text: string): boolean {
  return text.toLowerCase().startsWith('n');
}

function parseYesOrNo(text: string): boolean|undefined {
  if (isYes(text)) return true;
  if (isNo(text)) return false;
  return undefined;
}

function getEfnycBoroughId(boroughGid: GeoSearchBoroughGid): string {
  switch (boroughGid) {
    case GeoSearchBoroughGid.Manhattan: return 'manhattan';
    case GeoSearchBoroughGid.Queens: return 'queens';
    case GeoSearchBoroughGid.Brooklyn: return 'brooklyn';
    case GeoSearchBoroughGid.Bronx: return 'bronx';
    case GeoSearchBoroughGid.StatenIsland: return 'staten';
  }

  throw new Error(`Invalid borough gid: ${boroughGid}`);
}

function ensureRtcInfo(info: Partial<RtcInfo>): RtcInfo {
  const { boroughGid, zip, bbl, isIncomeEligible, evictionType } = info;

  if (boroughGid === undefined || zip === undefined || isIncomeEligible === undefined || evictionType === undefined || bbl === undefined) {
    throw new Error('RtcInfo is not complete!');
  }

  return { boroughGid, zip, bbl, isIncomeEligible, evictionType };
}

// This is a feeble attempt to encapsulate the logic contained in the following files:
//
// https://github.com/JustFixNYC/eviction-free-nyc/blob/master/src/utils/logic.js
// https://github.com/JustFixNYC/eviction-free-nyc/blob/master/functions/resultspageurl-lambda.js
function getRtcHelp({ zip, boroughGid, evictionType, isIncomeEligible, bbl }: RtcInfo): {title: string, url: string} {
  const borough = getEfnycBoroughId(boroughGid);
  const locale = 'en-US';
  const host = 'www.evictionfreenyc.org';
  const isNYCHA = !!getNychaInfo(bbl);
  const isRtcZip = isRtcZipcode(zip);
  const isEligible = isRtcZip && isIncomeEligible;
  const rtc = evictionType !== 'general' && isEligible ? 'rtc' : '';

  if (isNYCHA && evictionType === 'general') {
    return {
      title: 'If the head of household in your apartment is 62 years or older, and you have an administrative hearing at NYCHA, you have the right to an attorney. Otherwise, you still have options to get assistance.',
      url: `https://${host}/${locale}/admin-hearings`
    };
  }

  return {
    title: rtc ? 'Great news! You likely have the right to a free attorney.' : 'You may not yet have the right to a free attorney, but you still have options to get assistance!',
    url: `https://${host}/${locale}/guide/${borough}/${evictionType}${rtc}?zip=${zip}`
  };
}
