"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import { MapPin, Plus, Trash2, Edit2, Star, Clock, Phone } from "lucide-react";
import { LocationSelect } from "@/components/ui/LocationSelect";

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
  const { currentUser, token } = useAuth();
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
  });

  const businessId = currentUser?.businessId || (currentUser as any)?.business?._id;

  const fetchLocations = async () => {
    if (!businessId) return;
    try {
      setLoading(true);
      const res = await axios.get(`${getApiUrl()}/businesses/${businessId}/locations`);
      setLocations(res.data.data || []);
    } catch (err) {
      console.error("Failed to fetch locations", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [businessId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    
    try {
      const payload = { ...formData, coordinates: { latitude: 40.1872, longitude: 44.5152 } }; // basic fallback coords

      if (editingId) {
        await axios.put(`${getApiUrl()}/businesses/locations/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${getApiUrl()}/businesses/${businessId}/locations`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      setIsModalOpen(false);
      setEditingId(null);
      fetchLocations();
    } catch (err) {
      console.error("Failed to save location", err);
      alert("Error saving location");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;
    try {
      await axios.delete(`${getApiUrl()}/businesses/locations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchLocations();
    } catch (err) {
      console.error("Failed to delete", err);
      alert("Error deleting location");
    }
  };

  const openEdit = (loc: Location) => {
    setFormData({
      name: loc.name,
      address: loc.address,
      city: loc.city,
      phone: loc.phone || "",
      workingHours: loc.workingHours || "",
      isPrimary: loc.isPrimary,
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
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  if (!businessId) return <div className="p-8">Please complete your business profile first.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Locations</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Manage your business branches and addresses.</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Branch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="animate-pulse flex items-center gap-2"><MapPin className="text-[hsl(var(--primary))]"/> Loading...</div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map(loc => (
            <div key={loc._id} className="border border-[hsl(var(--border))] bg-[hsl(var(--card))] rounded-xl p-5 shadow-sm relative overflow-hidden group">
              {loc.isPrimary && (
                <div className="absolute top-0 right-0 bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-xs font-bold px-3 py-1 rounded-bl-xl flex items-center gap-1">
                  <Star className="w-3 h-3 fill-[hsl(var(--primary))]" /> Primary
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
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] w-full max-w-lg rounded-2xl p-6 relative shadow-2xl">
            <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Branch" : "Add New Branch"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Branch Name / Label *</label>
                <input 
                  type="text" 
                  className="w-full form-input" 
                  placeholder="e.g. Downtown Branch" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
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
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  required 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input 
                    type="text" 
                    className="w-full form-input" 
                    placeholder="+374..." 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Working Hours</label>
                  <input 
                    type="text" 
                    className="w-full form-input" 
                    placeholder="e.g. 10:00 - 22:00" 
                    value={formData.workingHours}
                    onChange={e => setFormData({...formData, workingHours: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <input 
                  type="checkbox" 
                  id="isPrimary" 
                  checked={formData.isPrimary}
                  onChange={e => setFormData({...formData, isPrimary: e.target.checked})}
                />
                <label htmlFor="isPrimary" className="text-sm">Set as Primary Location</label>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[hsl(var(--border))]">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-[hsl(var(--muted))]">Cancel</button>
                <button type="submit" className="btn-primary px-4 py-2 text-sm">Save Branch</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
