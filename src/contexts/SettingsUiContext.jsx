import React, { createContext, useContext, useMemo, useState } from "react";
import SettingsDrawer from "../components/SettingsDrawer";

const SettingsUiContext = createContext(null);

export function SettingsUiProvider({ children }) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Simple functions (no need for useCallback unless heavy app)
  const openSettings = () => setSettingsOpen(true);
  const closeSettings = () => setSettingsOpen(false);
  const toggleSettings = () => setSettingsOpen((o) => !o);

  // Only depend on state
  const value = useMemo(() => ({
    settingsOpen,
    openSettings,
    closeSettings,
    toggleSettings
  }), [settingsOpen]);

  return (
    <SettingsUiContext.Provider value={value}>
      {children}
      <SettingsDrawer open={settingsOpen} onClose={closeSettings} />
    </SettingsUiContext.Provider>
  );
}

// Custom hook with safety check
export function useSettingsUi() {
  const context = useContext(SettingsUiContext);
  if (!context) {
    throw new Error("useSettingsUi must be used within SettingsUiProvider");
  }
  return context;
}