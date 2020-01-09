export type TextitConversationStatus = "end"|"ask"|"loop";

export type TextitResponse = {
  text: string,
  conversationStatus: TextitConversationStatus,
  state: string,
};
