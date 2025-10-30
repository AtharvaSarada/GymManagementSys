import React, { useState, useRef } from 'react';
import { BillingService } from '../../services/billingService';
import type { Bill } from '../../types/database';
import { FILE_CONSTRAINTS } from '../../types/database';
import { supabase } from '../../services/supabase';

interface PaymentProcessingProps {
  bill: Bill;
  onPaymentProcessed: () => void;
  onCancel: () => void;
}

export const PaymentProcessing: React.FC<PaymentProcessingProps> = ({
  bill,
  onPaymentProcessed,
  onCancel
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl] = useState(bill.receipt_url || '');
  const [notes, setNotes] = useState(bill.notes || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString()}`;
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!FILE_CONSTRAINTS.RECEIPT.ALLOWED_TYPES.includes(file.type as any)) {
      setError('Please select a valid file (PDF, JPEG, or PNG)');
      return;
    }

    if (file.size > FILE_CONSTRAINTS.RECEIPT.MAX_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }

    setReceiptFile(file);
    setError(null);
  };

  const uploadReceiptToStorage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `receipt-${bill.id}-${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload receipt: ${uploadError.message}`);
    }

    // Get public URL
    const { data } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleProcessPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      let finalReceiptUrl = receiptUrl;

      // Upload receipt if a new file was selected
      if (receiptFile) {
        setUploadingReceipt(true);
        finalReceiptUrl = await uploadReceiptToStorage(receiptFile);
        setUploadingReceipt(false);
      }

      // Mark bill as paid and activate membership
      await BillingService.markBillAsPaid(bill.id);

      // Update bill with receipt URL and notes if provided
      if (finalReceiptUrl || notes) {
        const { error: updateError } = await supabase
          .from('bills')
          .update({
            receipt_url: finalReceiptUrl || null,
            notes: notes || null
          })
          .eq('id', bill.id);

        if (updateError) {
          console.error('Failed to update bill with receipt/notes:', updateError);
        }
      }

      onPaymentProcessed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process payment');
      setUploadingReceipt(false);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = new Date(bill.due_date) < new Date();

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Process Payment
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Bill Information */}
        <div className={`border rounded-lg p-6 ${isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {bill.member?.user?.profile_photo_url ? (
                  <img
                    className="h-16 w-16 rounded-full object-cover"
                    src={bill.member.user.profile_photo_url}
                    alt={bill.member.user.full_name || 'Profile'}
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900">
                  {bill.member?.user?.full_name || 'N/A'}
                </h4>
                <p className="text-sm text-gray-600">
                  Membership: {bill.member?.membership_number}
                </p>
                <p className="text-sm text-gray-600">
                  Email: {bill.member?.user?.email}
                </p>
              </div>
            </div>
            {isOverdue && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Bill Details</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Package:</span>
                  <span className="font-medium">{bill.fee_package?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg">{formatCurrency(bill.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">
                    {bill.fee_package?.duration_months} month{bill.fee_package?.duration_months !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Generated:</span>
                  <span className="font-medium">{formatDate(bill.generated_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                    {formatDate(bill.due_date)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-3">Payment Impact</h5>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Member status will be set to ACTIVE
                </div>
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Membership will be activated immediately
                </div>
                <div className="flex items-center text-green-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Member will receive activation notification
                </div>
                <div className="flex items-center text-blue-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Membership expires: {bill.fee_package ? 
                    new Date(Date.now() + bill.fee_package.duration_months * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN') 
                    : 'N/A'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Upload */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Digital Receipt (Optional)</h4>
          
          {receiptUrl && !receiptFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-blue-800">Existing receipt available</span>
                </div>
                <a
                  href={receiptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View Receipt
                </a>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingReceipt}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              {uploadingReceipt ? 'Uploading...' : receiptFile ? 'Change Receipt' : 'Upload Receipt'}
            </button>
            
            {receiptFile && (
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {receiptFile.name}
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={FILE_CONSTRAINTS.RECEIPT.ALLOWED_TYPES.join(',')}
            onChange={handleReceiptUpload}
            className="hidden"
          />
          
          <p className="text-xs text-gray-500">
            Supported formats: PDF, JPEG, PNG. Maximum size: 10MB.
          </p>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Payment Notes (Optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="block w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any notes about this payment..."
          />
        </div>

        {/* Confirmation */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-800">Confirm Payment Processing</h4>
              <p className="text-sm text-yellow-700 mt-1">
                This action will mark the bill as paid and immediately activate the member's subscription. 
                This action cannot be undone.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessPayment}
            disabled={loading || uploadingReceipt}
            className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
          >
            {loading ? 'Processing...' : `Mark as Paid & Activate Membership`}
          </button>
        </div>
      </div>
    </div>
  );
};