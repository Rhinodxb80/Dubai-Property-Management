import type { Property } from "@/data/properties";

export const CUSTOM_PROPERTIES_STORAGE_KEY = "gilded-gems:custom-properties.v1";
export const CUSTOM_PROPERTIES_EVENT = "properties-updated";

const notifyUpdate = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CUSTOM_PROPERTIES_EVENT));
};

export const loadCustomProperties = (): Property[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(CUSTOM_PROPERTIES_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as Property[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load custom properties:", error);
    return [];
  }
};

export const saveCustomProperties = (properties: Property[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      CUSTOM_PROPERTIES_STORAGE_KEY,
      JSON.stringify(properties),
    );
    notifyUpdate();
  } catch (error) {
    console.error("Failed to persist custom properties:", error);
    throw error;
  }
};

export const upsertCustomProperty = (property: Property) => {
  const current = loadCustomProperties();
  const next = [property, ...current.filter((item) => item.id !== property.id)];
  saveCustomProperties(next);
  return next;
};

export const removeCustomProperty = (id: string) => {
  const current = loadCustomProperties();
  const next = current.filter((item) => item.id !== id);
  saveCustomProperties(next);
  return next;
};
