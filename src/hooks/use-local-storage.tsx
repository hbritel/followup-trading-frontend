
import * as React from "react"

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = React.useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      
      // If no value exists, set the initial value in localStorage
      if (item === null) {
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
      
      // Try to parse the stored value
      try {
        return JSON.parse(item);
      } catch (parseError) {
        console.error("Error parsing localStorage item:", parseError);
        // If parsing fails, reset to initial value
        window.localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  });

  const setValue = React.useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          // Use a try-catch to handle potential localStorage errors
          try {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
          } catch (storageError) {
            console.error("Error saving to localStorage:", storageError);
          }
        }
      } catch (error) {
        console.error("Error preparing value for localStorage:", error);
      }
    },
    [key, storedValue]
  );

  // Add this effect to sync with other tabs/windows and handle changes
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.error("Error parsing localStorage change:", error);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key]);

  return [storedValue, setValue] as const;
}
