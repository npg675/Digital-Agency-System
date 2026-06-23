import { useEffect } from 'react';

export function useWarnIfUnsavedChanges(
  hasUnsavedChanges: boolean,
  message: string = 'You have unsaved changes. Are you sure you want to leave?'
) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);
}
