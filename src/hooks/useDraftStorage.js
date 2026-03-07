import React from 'react';

const useDraftStorage = (storageKey, initialState) => {
  const [draft, setDraft] = React.useState(initialState);

  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (savedDraft) {
        const parsedDraft = JSON.parse(savedDraft);
        if (parsedDraft && typeof parsedDraft === 'object') {
          setDraft((prev) => ({ ...prev, ...parsedDraft }));
        }
      }
    } catch (error) {
      // Ignore draft load errors.
    }
  }, [storageKey]);

  React.useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
    } catch (error) {
      // Ignore draft save errors.
    }
  }, [draft, storageKey]);

  return [draft, setDraft];
};

export default useDraftStorage;
