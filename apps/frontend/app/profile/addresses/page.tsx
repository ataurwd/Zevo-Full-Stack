"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "../../../components/auth/ProtectedRoute";
import { 
  Address, 
  getAddresses, 
  createAddress, 
  setDefaultAddress, 
  deleteAddress 
} from "../../../lib/api/users";
import { 
  MapPin, 
  Plus, 
  Trash2, 
  CheckCircle, 
  ArrowLeft, 
  Loader2, 
  Home, 
  Briefcase, 
  Building 
} from "lucide-react";

export default function AddressBookPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [newAddr, setNewAddr] = useState({
    label: "Home",
    recipient_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postal_code: "",
    country: "United States",
    is_default: false,
  });

  const loadAddresses = async () => {
    try {
      const list = await getAddresses();
      setAddresses(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await createAddress(newAddr);
      setShowAddModal(false);
      setNewAddr({
        label: "Home",
        recipient_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "United States",
        is_default: false,
      });
      await loadAddresses();
    } catch (err: any) {
      alert(err?.message || "Failed creating address");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      await loadAddresses();
    } catch (err: any) {
      alert(err?.message || "Failed setting default address");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this delivery address?")) return;
    try {
      await deleteAddress(id);
      await loadAddresses();
    } catch (err: any) {
      alert(err?.message || "Failed removing address");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#080b12] text-slate-100 py-10 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 mb-8 border-b border-slate-800">
            <div>
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors mb-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Profile</span>
              </Link>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Delivery Addresses</h1>
              <p className="text-xs text-slate-400 mt-1">Manage saved shipping locations for expedited marketplace checkout</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/30 w-fit"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Address</span>
            </button>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-xs text-slate-400">Loading delivery addresses...</p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-20 glass-card rounded-2xl border border-slate-800 p-8">
              <MapPin className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No Saved Addresses</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                You have not registered any delivery addresses yet. Add one to enable fast cart checkout and rider delivery.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`glass-card rounded-2xl p-6 border transition-all ${
                    addr.is_default
                      ? "border-indigo-500/50 bg-indigo-950/10 shadow-lg shadow-indigo-500/10"
                      : "border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-indigo-400">
                        {addr.label?.toLowerCase() === "work" ? (
                          <Briefcase className="w-4 h-4" />
                        ) : addr.label?.toLowerCase() === "office" ? (
                          <Building className="w-4 h-4" />
                        ) : (
                          <Home className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-white uppercase tracking-wider">
                          {addr.label || "Address"}
                        </span>
                        {addr.is_default && (
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-medium">
                            Default
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(addr.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete Address"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 mb-6">
                    <p className="font-semibold text-white text-sm">{addr.recipient_name}</p>
                    <p>{addr.line1}</p>
                    {addr.line2 && <p>{addr.line2}</p>}
                    <p>
                      {addr.city}, {addr.state} {addr.postal_code}
                    </p>
                    <p className="text-slate-400">{addr.country}</p>
                    <p className="text-slate-400 pt-1 font-mono">{addr.phone}</p>
                  </div>

                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Set as Default</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modal */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
              <div className="w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-slate-700 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-white">Add Delivery Address</h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    Close
                  </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Label</label>
                      <select
                        value={newAddr.label}
                        onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Home">Home</option>
                        <option value="Work">Work / Office</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        required
                        value={newAddr.recipient_name}
                        onChange={(e) => setNewAddr({ ...newAddr, recipient_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newAddr.phone}
                      onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                      placeholder="+1 234 567 8900"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={newAddr.line1}
                      onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })}
                      placeholder="123 Market St"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Apt, Suite, Unit (Optional)</label>
                    <input
                      type="text"
                      value={newAddr.line2}
                      onChange={(e) => setNewAddr({ ...newAddr, line2: e.target.value })}
                      placeholder="Apt 4B"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">State / Province</label>
                      <input
                        type="text"
                        required
                        value={newAddr.state}
                        onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Postal / ZIP Code</label>
                      <input
                        type="text"
                        required
                        value={newAddr.postal_code}
                        onChange={(e) => setNewAddr({ ...newAddr, postal_code: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">Country</label>
                      <input
                        type="text"
                        required
                        value={newAddr.country}
                        onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="modal-default-check"
                      checked={newAddr.is_default}
                      onChange={(e) => setNewAddr({ ...newAddr, is_default: e.target.checked })}
                      className="rounded border-slate-800 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="modal-default-check" className="text-xs text-slate-300">
                      Set as default delivery address
                    </label>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                      {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Save Address</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
