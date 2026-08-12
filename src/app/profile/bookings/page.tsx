"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/lib/utils";
import axios from "axios";
import { Loader2, Calendar, MapPin, Clock, QrCode, Sparkles } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import Image from "next/image";

export default function MyBookingsPage() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      if (!currentUser) return;
      try {
        setLoading(true);
        const token = window.localStorage.getItem("token");
        const res = await axios.get(`${getApiUrl()}/bookings/user`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data?.success) {
          setBookings(res.data.data);
        }
      } catch (err) {
        setError("Failed to load your bookings");
      } finally {
        setLoading(false);
      }
    }
    loadBookings();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--primary))]" />
      </div>
    );
  }

  // Filter out completed/cancelled bookings from active view
  const activeBookings = bookings.filter(b => b.status === "pending" || b.status === "confirmed");
  const pastBookings = bookings.filter(b => b.status === "completed" || b.status === "cancelled");

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Bookings</h1>
      
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Active Bookings
          </h2>
          
          {activeBookings.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-[hsl(var(--border))] rounded-2xl text-[hsl(var(--muted-foreground))]">
              You have no active bookings right now.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {activeBookings.map(booking => (
                <div key={booking._id} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden shadow-sm flex flex-col">
                  {/* Business Header */}
                  <div className="p-4 border-b border-[hsl(var(--border))]/50 flex items-center gap-3">
                    {booking.business?.logo ? (
                      <Image src={booking.business.logo} alt="Logo" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm">
                        <Link href={`/business/${booking.business?.slug}`} className="hover:underline">
                          {booking.business?.name || "Unknown Business"}
                        </Link>
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Details */}
                  <div className="p-4 flex-1">
                    <div className="text-sm font-medium mb-1">{booking.serviceName}</div>
                    <div className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
                      {booking.totalPrice > 0 ? `${Number(booking.totalPrice).toLocaleString()} AMD` : "Price upon request"}
                    </div>
                    
                    {/* Status Badge */}
                    <div className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      booking.status === "confirmed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    }`}>
                      {booking.status === "confirmed" ? "Confirmed" : "Pending Confirmation"}
                    </div>
                  </div>

                  {/* QR Code Section */}
                  <div className="p-4 bg-[hsl(var(--muted))]/20 border-t border-[hsl(var(--border))]/50 flex flex-col items-center justify-center">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 text-center">
                      Present this QR code to the business upon arrival to complete your booking.
                    </p>
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200">
                      <QRCodeSVG value={booking.qrToken || booking._id} size={120} />
                    </div>
                    {booking.qrToken && (
                      <div className="mt-3 font-mono text-xs bg-[hsl(var(--background))] border border-[hsl(var(--border))] px-3 py-1.5 rounded-lg tracking-widest font-bold">
                        {booking.qrToken}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {pastBookings.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4 text-[hsl(var(--muted-foreground))]">Past Bookings</h2>
            <div className="space-y-3">
              {pastBookings.map(booking => (
                <div key={booking._id} className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl flex items-center justify-between opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))]/50 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{booking.business?.name || "Business"} - {booking.serviceName}</div>
                      <div className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(booking.date).toLocaleDateString()} at {booking.timeSlot}
                      </div>
                    </div>
                  </div>
                  <div className={`text-xs font-bold uppercase px-2 py-1 rounded-md ${
                    booking.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                  }`}>
                    {booking.status}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
