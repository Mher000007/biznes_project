"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import { Plus, Trash2, Edit2, Utensils, Users, MapPin, Tag } from "lucide-react";

interface Offer {
  _id: string;
  packageName: string;
  dishes: string[];
  pax: number;
  price: number;
  inclusions: string[];
  location: string;
}

export default function DashboardOffers() {
  const { currentUser } = useAuth();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    packageName: "",
    pax: 1 as number | string,
    price: 0 as number | string,
    location: "",
    dishesString: "",
    inclusionsString: ""
  });

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      if (!token) {
        setLoading(false);
        return;
      }
      const h = { headers: { Authorization: `Bearer ${token}` } };

      let bId = businessId || (currentUser as any)?.businessId || (currentUser as any)?.business?._id;
      if (!bId) {
        const bizRes = await axios.get(`${getApiUrl()}/businesses/me/all`, h);
        bId = bizRes.data?.data?.[0]?._id;
      }

      if (bId) {
        setBusinessId(bId);
        // Fetch locations for dropdown
        const locRes = await axios.get(`${getApiUrl()}/businesses/${bId}/locations`);
        setLocations(locRes.data.data || []);

        // Fetch offers
        const res = await axios.get(`${getApiUrl()}/offers/business/${bId}`);
        setOffers(res.data.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch offers", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    }
  }, [isModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;

    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      const payload = { 
        businessId,
        packageName: formData.packageName,
        pax: formData.pax,
        price: formData.price,
        location: formData.location,
        dishes: formData.dishesString.split(',').map(s => s.trim()).filter(Boolean),
        inclusions: formData.inclusionsString.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (editingId) {
        // Assume PUT /api/offers/:id exists in the future. For now we just create.
        // await axios.put(`${getApiUrl()}/offers/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`${getApiUrl()}/offers`, payload, { headers: { Authorization: `Bearer ${token}` } });
      }

      setIsModalOpen(false);
      fetchOffers();
    } catch (err: any) {
      console.error("Failed to save offer", err.response?.data || err.message);
      alert(err.response?.data?.error || "Failed to save offer");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
      await axios.delete(`${getApiUrl()}/offers/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchOffers();
    } catch (err) {
      console.error("Failed to delete offer", err);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      packageName: "",
      pax: 1,
      price: 0,
      location: locations.length > 0 ? locations[0].address : "",
      dishesString: "",
      inclusionsString: ""
    });
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[hsl(var(--primary))] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Menus &amp; Offers</h2>
          <p className="text-[hsl(var(--muted-foreground))]">Manage your restaurant packages and menus for the AI assistant.</p>
        </div>
        <button
          onClick={openAddModal}
          className="btn-primary py-2 px-4 rounded-xl flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium"
        >
          <Plus className="h-4 w-4" /> Add Package
        </button>
      </div>

      {offers.length === 0 ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] border-dashed p-12 text-center bg-[hsl(var(--muted))]/20">
          <Utensils className="mx-auto h-10 w-10 text-[hsl(var(--muted-foreground))] mb-4" />
          <h3 className="text-lg font-semibold mb-2">No packages yet</h3>
          <p className="text-[hsl(var(--muted-foreground))] max-w-sm mx-auto mb-6">
            Add your dining packages and menus to make them searchable by the AI assistant.
          </p>
          <button onClick={openAddModal} className="btn-primary py-2 px-4 rounded-xl inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Your First Package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offers.map((offer) => (
            <div key={offer._id} className="relative group rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-sm transition-all hover:border-[hsl(var(--primary))]/30 hover:shadow-md">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg">{offer.packageName}</h3>
                <button
                  onClick={() => handleDelete(offer._id)}
                  className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[hsl(var(--primary))]" /> 
                  <span className="font-medium text-[hsl(var(--foreground))]">{offer.price.toLocaleString()} AMD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" /> {offer.pax} Person{offer.pax !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> {offer.location}
                </div>
                
                <div className="mt-4 pt-3 border-t border-[hsl(var(--border))]">
                  <p className="font-medium text-[hsl(var(--foreground))] mb-1 text-xs uppercase">Dishes</p>
                  <p className="line-clamp-2">{offer.dishes.join(', ')}</p>
                </div>
                
                {offer.inclusions.length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-[hsl(var(--foreground))] mb-1 text-xs uppercase">Inclusions</p>
                    <p className="line-clamp-2">{offer.inclusions.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="px-6 py-4 border-b border-[hsl(var(--border))] flex justify-between items-center bg-[hsl(var(--muted))]/30">
              <h3 className="text-lg font-semibold">{editingId ? "Edit Package" : "Add New Package"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] text-2xl leading-none">&times;</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <form id="offerForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Package Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Silver Banquet"
                      value={formData.packageName}
                      onChange={e => setFormData({ ...formData, packageName: e.target.value })}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of People (Pax)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={formData.pax}
                      onChange={e => setFormData({ ...formData, pax: e.target.value === '' ? '' : parseInt(e.target.value) || '' })}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Total Price (AMD)</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value === '' ? '' : parseInt(e.target.value) || 0 })}
                      className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    {locations.length > 0 ? (
                      <select
                        required
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                      >
                        <option value="">Select a location...</option>
                        {locations.map(l => (
                          <option key={l._id} value={l.address}>{l.address}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required
                        type="text"
                        placeholder="Exact Address"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Dishes Included</label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Separate dishes with commas (e.g. Pork Khorovats, Khachapuri, Wine)</p>
                  <textarea
                    required
                    rows={3}
                    value={formData.dishesString}
                    onChange={e => setFormData({ ...formData, dishesString: e.target.value })}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Additional Inclusions</label>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">Separate with commas (e.g. Live Music, Waiter Service, Decoration)</p>
                  <textarea
                    rows={2}
                    value={formData.inclusionsString}
                    onChange={e => setFormData({ ...formData, inclusionsString: e.target.value })}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-2.5 text-sm outline-none focus:border-[hsl(var(--primary))] transition-colors resize-none"
                  />
                </div>
              </form>
            </div>
            <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex justify-end gap-3 bg-[hsl(var(--muted))]/30">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="offerForm"
                className="btn-primary py-2 px-6 rounded-xl text-sm font-medium shadow-sm"
              >
                {editingId ? "Save Changes" : "Create Package"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
