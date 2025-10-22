import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, Pencil, Plus, RefreshCw, Trash2, ExternalLink } from "lucide-react";
import {
  deleteProperty as deleteCustomProperty,
  getMergedProperties,
  useMergedProperties,
  persistMergedProperties,
  isCustomProperty,
} from "@/lib/property-service";
import { formatBedroomLabel, type Property } from "@/data/properties";

type VisibilityFilter = "all" | "visible" | "hidden";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const properties = useMergedProperties();
  const [search, setSearch] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>("all");

  const applyPropertyUpdate = useCallback((mutator: (list: Property[]) => Property[]) => {
    const next = mutator(getMergedProperties());
    persistMergedProperties(next);
  }, []);

  const filteredProperties = useMemo(() => {
    const term = search.trim().toLowerCase();
    return properties.filter((property) => {
      const matchesSearch =
        !term ||
        [property.name, property.neighborhood, property.subcluster, property.id]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(term));

      const visible = property.visible !== false;
      const matchesFilter =
        visibilityFilter === "all"
          ? true
          : visibilityFilter === "visible"
            ? visible
            : !visible;

      return matchesSearch && matchesFilter;
    });
  }, [properties, search, visibilityFilter]);

  const handleToggleVisibility = useCallback(
    (property: Property) => {
      applyPropertyUpdate((list) =>
        list.map((item) =>
          item.id === property.id
            ? { ...item, visible: item.visible === false, updatedAt: new Date().toISOString() }
            : item,
        ),
      );
      toast({
        title: "Visibility updated",
        description: `${property.name} ist jetzt ${property.visible === false ? "sichtbar" : "verborgen"}.`,
      });
    },
    [applyPropertyUpdate, toast],
  );

  const handleDelete = useCallback(
    (property: Property) => {
      if (!isCustomProperty(property)) {
        toast({
          title: "Standard-Property",
          description: "Einträge aus dem Basiskatalog können nicht gelöscht werden.",
          variant: "destructive",
        });
        return;
      }

      deleteCustomProperty(property.id);
      toast({
        title: "Property gelöscht",
        description: `${property.name} wurde entfernt.`,
      });
    },
    [toast],
  );

  const resetFilters = () => {
    setSearch("");
    setVisibilityFilter("all");
  };

  const totalVisible = properties.filter((property) => property.visible !== false).length;
  const totalHidden = properties.length - totalVisible;
  const customCount = properties.filter(isCustomProperty).length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">
              Verwalte Listings, Sichtbarkeit und Marketingzugänge an einer Stelle.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/")}>
              Website ansehen
            </Button>
            <Button className="bg-primary text-primary-foreground" onClick={() => navigate("/admin/edit/new")}>
              <Plus className="mr-2 h-4 w-4" />
              Property erstellen
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-[1500px] mx-auto px-6 py-8">
        <Tabs defaultValue="properties" className="space-y-6">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="properties">All Properties</TabsTrigger>
            <TabsTrigger value="tenants">Tenant Management</TabsTrigger>
            <TabsTrigger value="overview">Admin Übersicht</TabsTrigger>
          </TabsList>

          <TabsContent value="properties">
            <div className="grid gap-4 sm:grid-cols-3 mb-6">
              <StatsCard title="Sichtbare Listings" value={totalVisible} subtitle="Aktiv auf der Website" />
              <StatsCard title="Entwürfe" value={totalHidden} subtitle="Momentan verborgen" />
              <StatsCard title="Custom Properties" value={customCount} subtitle="Über das Admin Panel erstellt" />
            </div>

            <Card>
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>Property Listings ({filteredProperties.length})</CardTitle>
                    <CardDescription>
                      Steuerung der Sichtbarkeit, direkter Zugang zu Marketing- und Tenant-Ansichten.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Suche nach Name, ID oder Standort"
                      className="w-64"
                    />
                    <Select value={visibilityFilter} onValueChange={(value: VisibilityFilter) => setVisibilityFilter(value)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Sichtbarkeit filtern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle</SelectItem>
                        <SelectItem value="visible">Sichtbar</SelectItem>
                        <SelectItem value="hidden">Verborgen</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="ghost" onClick={resetFilters}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {filteredProperties.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    Keine Properties passen zu den aktuellen Filtern.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Standort</TableHead>
                          <TableHead>Schlafzimmer</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Quelle</TableHead>
                          <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProperties.map((property) => {
                          const isVisible = property.visible !== false;
                          const sourceBadge =
                            property.source === "custom" ? (
                              <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/20">Custom</Badge>
                            ) : (
                              <Badge variant="secondary">Default</Badge>
                            );

                          return (
                            <TableRow key={property.id}>
                              <TableCell className="font-medium">
                                <div className="flex flex-col">
                                  <span className="text-foreground">{property.name}</span>
                                  <span className="text-xs text-muted-foreground">{property.id}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span>{property.neighborhood || "—"}</span>
                                  {property.subcluster && (
                                    <span className="text-xs text-muted-foreground">{property.subcluster}</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{formatBedroomLabel(property.bedrooms ?? 0, property.maidsRoom)}</TableCell>
                              <TableCell>
                                <Button
                                  variant={isVisible ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleToggleVisibility(property)}
                                >
                                  {isVisible ? "Visible" : "Hidden"}
                                </Button>
                              </TableCell>
                              <TableCell>{sourceBadge}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2 flex-wrap">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/property/${property.id}`)}
                                  >
                                    Marketing
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/tenant/property/${property.id}`)}
                                  >
                                    Tenant
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/admin/view/${property.id}`)}
                                  >
                                    Admin
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(`/admin/view/${property.id}`)}
                                    title="Details ansehen"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => navigate(`/admin/edit/${property.id}`)}
                                    title="Bearbeiten"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(property)}
                                    title="Löschen"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tenants">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Interessenten & Leads</CardTitle>
                  <CardDescription>Behalte den Überblick über eingehende Anfragen.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Exportiere Leads für Follow-ups oder verbinde dein CRM, um neue Interessenten automatisch zu
                    synchronisieren.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/admin/lead-export")}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Leads exportieren
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dokumentenstatus</CardTitle>
                  <CardDescription>Verwalte eingereichte Unterlagen deiner Bewerber.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>
                    Dokumente anfordern, Erinnerungen senden und den Fortschritt vor dem Einzug nachvollziehen – alles an
                    einem Ort.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => navigate("/admin/document-requests")}>
                    Dokumente verwalten
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3">
              <StatsCard title="Gesamtportfolio" value={properties.length} subtitle="Standard + Custom Properties" />
              <StatsCard title="Ø Schlafzimmer" value={averageBedrooms(properties)} subtitle="Über alle Listings hinweg" />
              <StatsCard title="Ø Flächenmaß" value={`${averageSize(properties)} sqft`} subtitle="Durchschnittliche Wohnfläche" />
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Nächste Schritte</CardTitle>
                <CardDescription>Empfehlungen für deinen täglichen Workflow.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>• Verborgene Listings überprüfen und bei Bedarf reaktivieren.</p>
                <p>• Neue Custom Properties mit Bildern, Floorplans und Verfügbarkeiten ergänzen.</p>
                <p>• Marketing-, Tenant- oder Admin-Links direkt aus der Tabelle teilen.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;

const StatsCard = ({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string | number;
  subtitle: string;
}) => (
  <Card className="border-dashed bg-muted/40">
    <CardHeader className="pb-2">
      <CardDescription>{title}</CardDescription>
      <CardTitle className="text-2xl">{value}</CardTitle>
    </CardHeader>
    <CardContent className="text-xs text-muted-foreground">{subtitle}</CardContent>
  </Card>
);

const averageBedrooms = (properties: Property[]) => {
  if (!properties.length) return "0.0";
  const total = properties.reduce((sum, property) => sum + (property.bedrooms ?? 0), 0);
  return (total / properties.length).toFixed(1);
};

const averageSize = (properties: Property[]) => {
  if (!properties.length) return 0;
  const total = properties.reduce((sum, property) => sum + (property.sqft ?? 0), 0);
  return Math.round(total / properties.length);
};
