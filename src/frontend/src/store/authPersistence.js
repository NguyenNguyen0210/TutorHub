const USER_KEY = 'tutorhub_user';
const TOKEN_KEY = 'tutorhub_token';
const REFRESH_KEY = 'tutorhub_refresh_token';

export const getStoredItem = (key) => localStorage.getItem(key) || sessionStorage.getItem(key);

export const getSavedRememberMe = () => localStorage.getItem(REFRESH_KEY) !== null;

export function persistLogin(userData, tokens, rememberMe) {
  const targetStorage = rememberMe ? localStorage : sessionStorage;
  const alternateStorage = rememberMe ? sessionStorage : localStorage;

  for (const key of [USER_KEY, TOKEN_KEY, REFRESH_KEY]) {
    alternateStorage.removeItem(key);
  }

  targetStorage.setItem(USER_KEY, JSON.stringify(userData));
  targetStorage.setItem(TOKEN_KEY, tokens.accessToken);
  if (tokens.refreshToken) {
    targetStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  }
}
