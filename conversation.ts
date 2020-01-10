/**
 * The status of a conversation after a conversation handler has returned.
 */
export enum ConversationStatus {
  /** The conversation is over. */
  End = "end",

  /** A question has just been asked, so the UI should wait for user input. */
  Ask = "ask",

  /** 
   * A message has been displayed, but it is not a question, so the UI
   * should not wait for user input.
   */
  Loop = "loop",
};

/**
 * A response returned by a conversation handler.
 */
export type ConversationResponse = {
  /** The text that the UI should show the user. */
  text: string,

  /** The current status of the conversation. */
  conversationStatus: ConversationStatus,

  /**
   * The current internal state of the conversation. It's
   * meant to be opaque and passed back into the
   * conversation handler when it's next run.
   */
  state: string,
};
