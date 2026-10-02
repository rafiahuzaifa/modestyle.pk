"use client";

import { createContext, useContext } from "react";
import { DEFAULT_SETTINGS, toPublicSettings, type PublicSettings } from "@/lib/settings-shared";

const SettingsContext = createContext<PublicSettings>(toPublicSettings(DEFAULT_SETTINGS));

/** Makes admin-managed store settings available to client components. Fed by the root layout. */
export function SettingsProvider({ settings, children }: { settings: PublicSettings; children: React.ReactNode }) {
  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  return useContext(SettingsContext);
}
