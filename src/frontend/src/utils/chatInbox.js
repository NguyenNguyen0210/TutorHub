export function includeActiveConversation(inbox, active) {
  if (!active?.id || inbox.some(item => item.id === active.id)) return inbox;
  return [active, ...inbox];
}
