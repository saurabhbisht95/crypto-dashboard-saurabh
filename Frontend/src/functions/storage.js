export const getStorageValue = (key, fallback = null) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return fallback;
    }

    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
};

export const setStorageValue = (key, value) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export const removeStorageValue = (key) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }

    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const getJsonStorageValue = (key, fallback) => {
  const value = getStorageValue(key);

  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    removeStorageValue(key);
    return fallback;
  }
};

export const setJsonStorageValue = (key, value) => {
  return setStorageValue(key, JSON.stringify(value));
};
