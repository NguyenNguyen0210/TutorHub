export function appendToast(previous, toast, limit = 3) {
  const unique = typeof toast.content === 'string'
    ? previous.filter(item => item.type !== toast.type || item.content !== toast.content)
    : previous;
  return [...unique, toast].slice(-limit);
}
