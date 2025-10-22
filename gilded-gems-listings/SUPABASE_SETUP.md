# Supabase Setup & Migration Guide

## 1. Supabase Projekt einrichten

1. Gehe zu [https://supabase.com](https://supabase.com) und erstelle ein Projekt
2. Hole die Credentials:
   - Project URL
   - Anon/Public Key

## 2. Environment Variables setzen

Erstelle eine `.env` Datei im `gilded-gems-listings` Verzeichnis:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

In Vercel (Production):
1. Settings → Environment Variables
2. Füge die gleichen Variablen hinzu

## 3. Supabase Migrationen ausführen

Die Migrationen werden automatisch durch Supabase ausgeführt, wenn du sie in den `supabase/migrations` Ordner legst.

Über Supabase Dashboard:
1. SQL Editor öffnen
2. Führe folgende Migrationen in dieser Reihenfolge aus:
   - `20251022091500_add_properties_table.sql`
   - `20251022150000_setup_storage.sql`
   - `20251022150100_update_properties_table.sql`

## 4. Storage Bucket manuell erstellen

Wenn der Bucket nicht automatisch erstellt wurde:

1. Gehe zu Storage im Supabase Dashboard
2. Erstelle einen neuen Bucket `property-images`
3. Setze ihn auf "Public"
4. Storage Policies werden automatisch durch die Migration gesetzt

## 5. Initiale Properties migrieren

```bash
cd gilded-gems-listings
npm install -g ts-node
ts-node scripts/migrate-properties.ts
```

## 6. Bilder zu Supabase Storage hochladen

### Option A: Über Admin-Panel (nach dem Update)
1. Gehe zu `/admin`
2. Bearbeite eine Property
3. Lade Bilder hoch - sie werden automatisch zu Supabase Storage hochgeladen

### Option B: Manuell über Supabase Dashboard
1. Storage → property-images
2. Lade Bilder hoch
3. Kopiere die Public URLs
4. Aktualisiere die Properties in der Datenbank

## Bildqualität Einstellungen

Die Bilder werden mit folgenden Einstellungen gespeichert:
- **Format**: WebP (wenn unterstützt), sonst JPEG/PNG
- **Max. Dimension**: 1920px (für Hauptbilder)
- **Qualität**: 85% (guter Kompromiss zwischen Qualität und Größe)
- **Cache**: 1 Stunde (3600s)

## Storage Structure

```
property-images/
├── properties/
│   ├── {property-id}/
│   │   ├── main-image.webp
│   │   ├── gallery/
│   │   │   ├── image-1.webp
│   │   │   ├── image-2.webp
│   │   │   └── ...
│   │   └── floorplan/
│   │       └── floorplan.webp
│   └── development/
│       ├── {property-id}/
│       │   ├── amenity-1.webp
│       │   └── ...
```

## API Verwendung

### Properties abrufen
```typescript
import { fetchProperties } from '@/lib/property-service-v2';

const properties = await fetchProperties();
```

### Property hochladen
```typescript
import { uploadImage } from '@/lib/storage-service';

const image = await uploadImage(file, `properties/${propertyId}`);
// image.publicUrl enthält die öffentliche URL
```

## Troubleshooting

### Bilder werden nicht angezeigt
- Überprüfe, ob der Bucket "Public" ist
- Prüfe die Storage Policies
- Überprüfe die URLs in der Datenbank

### Migration schlägt fehl
- Stelle sicher, dass die Environment Variables gesetzt sind
- Prüfe die Supabase Credentials
- Überprüfe die Tabellenstruktur im SQL Editor

### Upload schlägt fehl
- Max. Dateigröße: 10MB
- Nur Bildformate erlaubt
- Überprüfe die Storage Policies für Upload-Rechte

