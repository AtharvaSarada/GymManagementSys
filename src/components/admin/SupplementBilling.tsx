import React, { useState, useEffect } from 'react';
import { SupplementService } from '../../services/supplementService';
import { MemberService } from '../../services/memberService';

import { supabase } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Supplement, Member } from '../../types/database';

export const SupplementBilling: React.FC = () => {
  const { user } = useAuth();
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Bill generation form state
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedSupplement, setSelectedSupplement] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [supplementsData, membersData] = await Promise.all([
        SupplementService.getAvailableSupplements(),
        MemberService.getAllMembers()
      ]);

      setSupplements(supplementsData);
      setMembers(membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedMember || !selectedSupplement || quantity < 1) return;

    setGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      // Get supplement details
      const supplement = supplements.find(s => s.id === selectedSupplement);
      if (!supplement) {
        setError('Supplement not found');
        return;
      }

      // Check stock availability
      if (supplement.stock_quantity < quantity) {
        setError(`Insufficient stock. Available: ${supplement.stock_quantity}`);
        return;
      }

      // Calculate total amount
      const totalAmount = supplement.price * quantity;

      // Create bill directly using Supabase
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          member_id: selectedMember,
          fee_package_id: null, // No fee package for supplement purchases
          bill_type: 'SUPPLEMENT', // Specify this is a supplement bill
          amount: totalAmount,
          currency: 'INR',
          due_date: new Date().toISOString().split('T')[0],
          status: 'PENDING',
          generated_date: new Date().toISOString().split('T')[0],
          notes: notes || `Supplement purchase: ${supplement.name} (Qty: ${quantity})`
        })
        .select('id')
        .single();

      if (billError) {
        setError('Failed to generate bill: ' + billError.message);
        return;
      }

      const result = { success: true, billId: billData.id };

      if (result.success) {
        // Create notification for the member using Supabase
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            member_id: selectedMember,
            type: 'BILL_PENDING',
            title: 'Supplement Bill Generated',
            message: `A bill for ${supplement.name} (₹${totalAmount}) has been generated. Please contact admin for payment.`,
            related_bill_id: result.billId,
            related_package_name: supplement.name
          });

        if (notificationError) {
          console.error('Failed to create notification:', notificationError);
        }

        setSuccess(`Bill generated successfully for ${supplement.name}. Total: ₹${totalAmount}`);
        
        // Reset form
        setSelectedMember('');
        setSelectedSupplement('');
        setQuantity(1);
        setNotes('');
      } else {
        setError('Failed to generate bill');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bill generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const selectedSupplementData = supplements.find(s => s.id === selectedSupplement);
  const totalAmount = selectedSupplementData ? selectedSupplementData.price * quantity : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-sm text-gray-500">Loading supplement billing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Supplement Billing</h2>
          <p className="text-gray-600">Generate bills for member supplement purchases</p>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="ml-auto text-green-400 hover:text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Bill Generation Form */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate Supplement Bill</h3>
        
        <form onSubmit={handleGenerateBill} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Member *
              </label>
              <select
                required
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a member...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.user?.full_name} ({member.membership_number}) - {member.user?.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Supplement *
              </label>
              <select
                required
                value={selectedSupplement}
                onChange={(e) => setSelectedSupplement(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Choose a supplement...</option>
                {supplements.map((supplement) => (
                  <option key={supplement.id} value={supplement.id}>
                    {supplement.name} - ₹{supplement.price} (Stock: {supplement.stock_quantity})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                type="number"
                required
                min="1"
                max={selectedSupplementData?.stock_quantity || 1}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {selectedSupplementData && (
                <p className="text-xs text-gray-500 mt-1">
                  Available stock: {selectedSupplementData.stock_quantity}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Amount
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                <span className="text-lg font-semibold text-green-600">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes for this bill..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Supplement Details Preview */}
          {selectedSupplementData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Supplement Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 font-medium">Name:</span>
                  <p className="text-blue-800">{selectedSupplementData.name}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Category:</span>
                  <p className="text-blue-800">{selectedSupplementData.category}</p>
                </div>
                <div>
                  <span className="text-blue-700 font-medium">Unit Price:</span>
                  <p className="text-blue-800">₹{selectedSupplementData.price}</p>
                </div>
              </div>
              {selectedSupplementData.description && (
                <div className="mt-2">
                  <span className="text-blue-700 font-medium">Description:</span>
                  <p className="text-blue-800 text-sm">{selectedSupplementData.description}</p>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={generating || !selectedMember || !selectedSupplement || quantity < 1}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {generating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Generating Bill...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>Generate Bill (₹{totalAmount.toFixed(2)})</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};