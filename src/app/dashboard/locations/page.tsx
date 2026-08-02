"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import api from "@/lib/api";
import { MapPin, Plus, Trash2, Edit2, Star, Clock, Phone } from "lucide-react";
import { LocationSelect } from "@/components/ui/LocationSelect";
import { useI18n } from "@/i18n";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });
const LocationPicker = dynamic(() => import("@/components/map/LocationPicker"), { ssr: false });

interface Location {
  _id: string;
  name: string;
  address: string;
  city: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  phone?: string;
  workingHours?: string;
  isPrimary: boolean;
}

export default function DashboardLocations() {
  const { t } = useI18n();
  const { currentUser } = useAuth();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    workingHours: "",
    isPrimary: false,
    coordinates: { latitude: 40.1872, longitude: 44.5152 },
  });

  const [businessId, setBusinessId] = useState<string | null>(null);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      let bId = businessId || (currentUser as any)?.businessId || (currentUser as any)?.business?._id;
      if (!bId) {
        const bizRes = await api.get("/businesses/me/all");
        bId = bizRes.data?.data?.[0]?._id;
      }

      if (bId) {
        setBusinessId(bId);
        const res = await api.get(`/businesses/${bId}/locations`);
        setLocations(res.data.data || []);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error("Failed to fetch locations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Disable body scroll when modal is open
  useEffect(() => {
    if (isModalOpen || deleteTargetId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen, deleteTargetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      const payload = {
        ...formData,
        phone: formData.phone.trim() ? `+374${formData.phone.trim()}` : ""
      };

      if (editingId) {
        await api.put(`/businesses/locations/${editingId}`, payload);
      } else {
        await api.post(`/businesses/${businessId}/locations`, payload);
      }

      setIsModalOpen(false);
      setEditingId(null);
      fetchLocations();
    } catch (err: any) {
      console.error("Failed to save location", err);
      alert(err.response?.data?.message || "Error saving location");
    }
  };

  const handleDelete = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/businesses/locations/${deleteTargetId}`);
      setDeleteTargetId(null);
      fetchLocations();
    } catch (err: any) {
      console.error("Failed to delete location", err);
      alert(err.response?.data?.message || "Error deleting location");
    } finally {
      setIsDeleting(false);
    }
  };

  const openEdit = (loc: Location) => {
    setFormData({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      phone: (loc.phone || "").replace(/^\+374/, ""),
      workingHours: loc.workingHours || "",
      isPrimary: loc.isPrimary,
      coordinates: loc.coordinates || { latitude: 40.1872, longitude: 44.5152 },
    });
    setEditingId(loc._id);
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      phone: "",
      workingHours: "",
      isPrimary: locations.length === 0,
      coordinates: { latitude: 40.1872, longitude: 44.5152 },
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (!loading && !businessId) return <div className="p-8">Please complete your business profile first.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.locations.myLocations}</h1>
          <p className="text-[hsl(var(--muted-foreground))]">{t.dashboard.locations.manageBranches}</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t.dashboard.locations.addBranch}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-pulse flex items-center gap-2"><MapPin className="text-[hsl(var(--primary))]" /> Loading...</div></div>
      ) : (
        <div className="space-y-6">
          {locations.length > 0 && (
            <div className="rounded-xl border border-[hsl(var(--border))] overflow-hidden bg-[hsl(var(--card))] p-1 shadow-sm">
              <LeafletMap
                center={
                  locations[0]?.coordinates
                    ? [locations[0].coordinates.latitude, locations[0].coordinates.longitude]
                    : [40.1872, 44.5152]
                }
                zoom={12}
                height="300px"
                readonly={true}
                fitAllBounds={true}
                markers={locations.map(loc => ({
                  id: loc._id,
                  lat: loc.coordinates?.latitude || 40.1872,
                  lng: loc.coordinates?.longitude || 44.5152,
                  name: loc.name,
                  popupContent: `<b>${loc.name}</b><br/>${loc.address}, ${loc.city}`
                }))}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {locations.map(loc => (
              <div key={loc._id} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-sm relative overflow-hidden group">
                {loc.isPrimary && (
                  <div className="absolute top-0 right-0 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[hsl(var(--primary))]" /> {(t.dashboard.locations as any).primary || "Primary"}
                  </div>
                )}
                <h3 className="font-semibold text-lg flex items-center gap-2 pr-20">
                  <MapPin className="w-5 h-5 text-[hsl(var(--primary))]" />
                  {loc.name}
                </h3>
                <p className="text-[hsl(var(--muted-foreground))] text-sm mt-1">{loc.address}, {loc.city}</p>

                <div className="mt-4 space-y-2 text-sm">
                  {loc.phone && <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]"><Phone className="w-4 h-4" /> {loc.phone}</div>}
                  {loc.workingHours && <div className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]"><Clock className="w-4 h-4" /> {loc.workingHours}</div>}
                </div>

                <div className="mt-6 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(loc)} className="p-2 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded hover:bg-[hsl(var(--border))] transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(loc._id)} className="p-2 bg-red-500/10 text-red-500 rounded hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {locations.length === 0 && (
              <div className="col-span-full text-center py-12 border-2 border-dashed border-[hsl(var(--border))] rounded-xl text-[hsl(var(--muted-foreground))]">
                <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No locations added yet.</p>
                <button onClick={openAdd} className="mt-4 text-[hsl(var(--primary))] font-medium hover:underline">Add your first branch</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-4xl rounded-2xl p-6 relative shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">{editingId ? "Edit Branch" : "Add New Branch"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Branch Name / Label *</label>
                    <input
                      type="text"
                      className="w-full form-input"
                      placeholder="e.g. Downtown Branch"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">City / Region *</label>
                    <LocationSelect
                      required
                      className="w-full form-input"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Select City"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Street Address *</label>
                    <input
                      type="text"
                      className="w-full form-input"
                      placeholder="e.g. 15 Tumanyan St"
                      value={formData.address}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <div className="flex w-full border border-[hsl(var(--border))] rounded-lg bg-transparent overflow-hidden focus-within:border-[hsl(var(--primary))] focus-within:ring-1 focus-within:ring-[hsl(var(--primary))] transition-all">
                      <div className="px-3 py-2 bg-[hsl(var(--muted))]/50 text-sm font-medium border-r border-[hsl(var(--border))] flex items-center justify-center text-[hsl(var(--foreground))] select-none">
                        +374
                      </div>
                      <input
                        type="tel"
                        className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                        placeholder="XX XXXXXX"
                        value={formData.phone}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                          setFormData({ ...formData, phone: val });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="checkbox"
                      id="isPrimary"
                      checked={formData.isPrimary}
                      onChange={e => setFormData({ ...formData, isPrimary: e.target.checked })}
                    />
                    <label htmlFor="isPrimary" className="text-sm">Set as Primary Location</label>
                  </div>
                </div>

                {/* Right Column: Map */}
                <div className="flex flex-col h-full">
                  <label className="block text-sm font-medium mb-1">Pin on Map *</label>
                  <div className="flex-1 min-h-[250px]">
                    <LocationPicker
                      lat={formData.coordinates.latitude}
                      lng={formData.coordinates.longitude}
                      onLocationChange={(lat, lng, addr, extractedCity) => {
                        setFormData((prev) => ({
                          ...prev,
                          coordinates: { latitude: lat, longitude: lng },
                          address: addr ? addr.split(',').slice(0, 2).join(',').trim() : prev.address,
                          ...(extractedCity ? { city: extractedCity } : {})
                        }));
                      }}
                      height="100%"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-[hsl(var(--border))]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">Cancel</button>
                <button type="submit" className="btn-primary px-6 py-2 text-sm font-medium">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 z-[9999] animate-in fade-in duration-200">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] w-full max-w-sm rounded-2xl p-6 relative shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-1">
                Ջնջե՞լ մասնաճյուղը
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed">
                Արդյո՞ք ցանկանում եք ջնջել այս մասնաճյուղը: Այս գործողությունը հնարավոր չէ հետ շրջել:
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 px-3.5 py-2 rounded-xl border border-[hsl(var(--border))] text-xs font-semibold text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] transition-colors cursor-pointer"
              >
                Չեղարկել
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Ջնջվում է..." : "Այո, ջնջել"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
