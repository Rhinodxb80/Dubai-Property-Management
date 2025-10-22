import { useEffect, useState } from "react";
import { properties as initialProperties } from "@/data/properties";
import type { Property } from "@/data/properties";
import {
  CUSTOM_PROPERTIES_EVENT,
  CUSTOM_PROPERTIES_STORAGE_KEY,
  loadCustomProperties,
  removeCustomProperty,
  saveCustomProperties,
  upsertCustomProperty,
} from "./property-storage";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert } from "@/integrations/supabase/types";

const isBrowser = typeof window !== "undefined";
const isSupabaseConfigured =
  Boolean(import.meta.env.VITE_SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const PROPERTIES_TABLE = "properties";

let customPropertiesCache: Property[] = [];

const notifyListeners = () => {
  if (!isBrowser) return;
  window.dispatchEvent(new Event(CUSTOM_PROPERTIES_EVENT));
};

const stripSource = (property: Property) => {
  const { source, ...rest } = property;
  return rest;
};

const convertRowToProperty = (row: { id: string; data: unknown }): Property => {
  const parsed = (row.data ?? {}) as Property;
  return {
    ...parsed,
    id: parsed.id ?? row.id,
  };
};

const fetchSupabaseProperties = async (): Promise<Property[]> => {
  try {
    const { data, error } = await supabase.from(PROPERTIES_TABLE).select("id, data");
    if (error) {
      console.error("Failed to load properties from Supabase:", error);
      return customPropertiesCache;
    }
    const mapped = (data ?? []).map(convertRowToProperty);
    customPropertiesCache = mapped;
    notifyListeners();
    return mapped;
  } catch (error) {
    console.error("Unexpected error while loading properties from Supabase:", error);
    return customPropertiesCache;
  }
};

if (!isSupabaseConfigured && isBrowser) {
  customPropertiesCache = loadCustomProperties();
}

const getCustomPropertiesSnapshot = (): Property[] => {
  if (isSupabaseConfigured) {
    return customPropertiesCache;
  }
  return isBrowser ? loadCustomProperties() : [];
};

const withSource = (list: Property[], source: "initial" | "custom") =>
  list.map((item) => ({ ...item, source }));

export const mergeProperties = (custom: Property[]): Property[] => {
  const customWithSource = withSource(custom, "custom");
  const initialWithSource = withSource(initialProperties, "initial");
  const filteredInitial = initialWithSource.filter(
    (base) => !customWithSource.some((item) => item.id === base.id),
  );
  return [...customWithSource, ...filteredInitial];
};

export const getMergedProperties = (): Property[] => {
  const custom = getCustomPropertiesSnapshot();
  return mergeProperties(custom);
};

export const findPropertyById = (id: string): Property | undefined =>
  getMergedProperties().find((property) => property.id === id);

export const isCustomProperty = (property: Property | undefined) =>
  property?.source === "custom";

export const persistMergedProperties = async (properties: Property[]) => {
  const customOnly = properties
    .filter((property) => property.source === "custom")
    .map(stripSource);

  if (isSupabaseConfigured) {
    const payload = customOnly.map<TablesInsert<"properties">>((property) => ({
      id: property.id,
      data: property,
    }));
    try {
      const { error } = await supabase.from(PROPERTIES_TABLE).upsert(payload, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (error) {
        console.error("Failed to persist properties to Supabase:", error);
        throw error;
      }
    } finally {
      await fetchSupabaseProperties();
    }
    return;
  }

  saveCustomProperties(customOnly);
  customPropertiesCache = customOnly;
};

export const upsertProperty = async (property: Property) => {
  if (isSupabaseConfigured) {
    const payload: TablesInsert<"properties"> = {
      id: property.id,
      data: stripSource(property),
    };
    try {
      const { error } = await supabase.from(PROPERTIES_TABLE).upsert(payload, {
        onConflict: "id",
        ignoreDuplicates: false,
      });
      if (error) {
        console.error("Failed to upsert property to Supabase:", error);
        throw error;
      }
    } finally {
      await fetchSupabaseProperties();
    }
    return;
  }

  upsertCustomProperty({ ...stripSource(property), source: "custom" });
  customPropertiesCache = loadCustomProperties();
};

export const deleteProperty = async (id: string) => {
  if (isSupabaseConfigured) {
    try {
      const { error } = await supabase.from(PROPERTIES_TABLE).delete().eq("id", id);
      if (error) {
        console.error("Failed to delete property from Supabase:", error);
        throw error;
      }
    } finally {
      await fetchSupabaseProperties();
    }
    return;
  }

  removeCustomProperty(id);
  customPropertiesCache = loadCustomProperties();
};

export const useMergedProperties = () => {
  const [properties, setProperties] = useState<Property[]>(() => getMergedProperties());

  useEffect(() => {
    const update = () => setProperties(getMergedProperties());

    window.addEventListener(CUSTOM_PROPERTIES_EVENT, update);

    let storageHandler: ((event: StorageEvent) => void) | undefined;
    let supabaseChannel: ReturnType<typeof supabase.channel> | undefined;

    if (isSupabaseConfigured) {
      fetchSupabaseProperties();
      supabaseChannel = supabase
        .channel("public:properties")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: PROPERTIES_TABLE },
          () => {
            fetchSupabaseProperties();
          },
        )
        .subscribe();
    } else {
      storageHandler = (event: StorageEvent) => {
        if (event.key === CUSTOM_PROPERTIES_STORAGE_KEY) {
          update();
        }
      };
      window.addEventListener("storage", storageHandler);
    }

    return () => {
      window.removeEventListener(CUSTOM_PROPERTIES_EVENT, update);
      if (storageHandler) {
        window.removeEventListener("storage", storageHandler);
      }
      if (supabaseChannel) {
        supabase.removeChannel(supabaseChannel);
      }
    };
  }, []);

  return properties;
};

export {
  CUSTOM_PROPERTIES_EVENT,
  CUSTOM_PROPERTIES_STORAGE_KEY,
  loadCustomProperties,
  removeCustomProperty,
  saveCustomProperties,
  upsertCustomProperty,
};
