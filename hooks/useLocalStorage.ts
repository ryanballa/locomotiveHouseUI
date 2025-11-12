import { useState, useEffect } from "react";

/**
 * Custom hook to set and retrieve data in client side local storage
 *
 * @param key - Local storage name
 * @param value - Local storage value
 *
 * @example
 * ```typescript
 * const [name, setName] = useLocalStorage<string>('name', '');
 *
 * ```
 */
function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.log(error);
    }
  }, [key]);

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.log(error);
    }
  };

  return [storedValue, setValue];
}

export default useLocalStorage;
