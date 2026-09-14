"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  createStore,
  updateMyStore,
  getMyStore,
  StoreProfile,
} from "../../../../lib/api/stores";
import { getMySellerProfile, SellerProfile } from "../../../../lib/api/sellers";
import {
  Store,
  Building2,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
} from "lucide-react";

export default function StoreSettingsPage() {
  const router = useRouter();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [store, setStore] = useState<StoreProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    email: "",
    phone: "",
    vacation_mode: false,
    address: {
      street: "",
      city: "",
      state: "",
      postal_code: "",
      country: "United States",
    },
    social_links: {
      facebook: "",
      instagram: "",
      twitter: "",
    },
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [sellerData, storeData] = await Promise.all([
          getMySellerProfile().catch(() => null),
          getMyStore().catch(() => null),
        ]);
        if (sellerData) setSeller(sellerData);
        if (storeData) {
          setStore(storeData);
          setFormData({
            name: storeData.name || sellerData?.business_name || "",
            description: storeData.description || "",
            email: (storeData as any).email || (storeData as any).contact_email || "",
            phone: (storeData as any).phone || (storeData as any).contact_phone || "",
            vacation_mode: storeData.vacation_mode || false,
            address: {
              street: storeData.address?.street || (storeData.address as any)?.line1 || "",
              city: storeData.address?.city || "Dhaka",
              state: storeData.address?.state || "Dhaka",
              postal_code: storeData.address?.postal_code || "1200",
              country: storeData.address?.country || "Bangladesh",
            },
            social_links: {
              facebook: storeData.social_links?.facebook || "",
              instagram: storeData.social_links?.instagram || "",
              twitter: storeData.social_links?.twitter || "",
            },
          });
        } else if (sellerData) {
          setFormData((prev) => ({
            ...prev,
            name: sellerData.business_name || "",
          }));
        }
      } catch (err: any) {
        console.error("Seller or store profile not found", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsSaving(true);

    try {
      if (!store) {
        const created = await createStore({
          name: formData.name,
          description: formData.description,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        });
        setStore(created);
        setSuccessMsg("Store profile created successfully!");
      } else {
        const updated = await updateMyStore({
          name: formData.name,
          description: formData.description,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          social_links: formData.social_links,
          vacation_mode: formData.vacation_mode,
        });
        setStore(updated);
        setSuccessMsg("Store settings updated successfully!");
      }
    } catch (err: any) {
      setError(err.message || "Failed saving store settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#D1E7D8] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E8F8EE] text-[#00A86B] font-mono text-[11px] font-bold border border-[#A2E4B8]">
              Storefront Profile
            </span>
            <span className="text-xs text-[#0A504A]/70 font-medium">Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#0A504A] tracking-tight">
            Store Settings & Operations
          </h1>
          <p className="text-xs sm:text-sm text-[#0A504A]/70 mt-1 font-medium">
            Customize your public storefront details, business coordinates, and operating status.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-[#D1E7D8] p-20 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#00A86B] animate-spin mb-3" />
          <p className="text-xs font-bold text-[#0A504A]/70 uppercase tracking-wider">
            Loading store settings...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-[#E8F8EE] border border-[#A2E4B8] text-[#0A504A] text-xs flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#00A86B]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* General Information */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D1E7D8] shadow-2xs space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A504A]/70 font-mono">
              Store Identity
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Store Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Apex Hyper-Electronics"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] font-semibold focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Support Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="support@mystore.com"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] font-semibold focus:outline-none focus:border-[#00A86B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                Store Bio / Description
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Short description highlighting what makes your store and products unique..."
                className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Support Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 000-1122"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] mt-1">
                <div>
                  <span className="text-xs font-bold text-[#0A504A] block">Vacation Mode</span>
                  <span className="text-[11px] text-[#0A504A]/60">Pause storefront ordering temporarily</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.vacation_mode}
                  onChange={(e) => setFormData({ ...formData, vacation_mode: e.target.checked })}
                  className="w-4 h-4 accent-[#00A86B] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Physical Fulfillment Coordinates */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#D1E7D8] shadow-2xs space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0A504A]/70 font-mono flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00A86B]" />
              <span>Fulfillment & Dispatch Coordinates</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  placeholder="100 Innovation Way, Suite 400"
                  className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    placeholder="San Francisco"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                    State / Province
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, state: e.target.value },
                      })
                    }
                    placeholder="CA"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={formData.address.postal_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postal_code: e.target.value },
                      })
                    }
                    placeholder="94107"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A504A] mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={formData.address.country}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, country: e.target.value },
                      })
                    }
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#F4FAF6] border border-[#D1E7D8] text-sm text-[#0A504A] focus:outline-none focus:border-[#00A86B]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#00A86B] hover:bg-[#088758] disabled:opacity-50 text-xs font-bold text-white transition-all shadow-2xs cursor-pointer"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Save Store Configuration</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
