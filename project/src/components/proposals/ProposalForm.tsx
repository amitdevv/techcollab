import React, { useState } from 'react';
import { Gig } from '../../types/gig';
import { ProposalSubmission, proposalApi } from '../../services/proposalApi';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import CustomSelect from '../ui/CustomSelect';

interface ProposalFormProps {
  gig: Gig;
  onSubmitted?: () => void;
  onCancel?: () => void;
}

const DELIVERY_OPTIONS = [
  { value: '1', label: '1 day' },
  { value: '3', label: '3 days' },
  { value: '7', label: '1 week' },
  { value: '14', label: '2 weeks' },
  { value: '21', label: '3 weeks' },
  { value: '30', label: '1 month' }
];

export const ProposalForm: React.FC<ProposalFormProps> = ({ gig, onSubmitted, onCancel }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProposalSubmission>({
    coverLetter: '',
    proposedPrice: gig.price || 0,
    deliveryTime: '7'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.coverLetter.trim()) {
      newErrors.coverLetter = 'Cover letter is required';
    } else if (formData.coverLetter.length < 50) {
      newErrors.coverLetter = 'Cover letter must be at least 50 characters';
    } else if (formData.coverLetter.length > 2000) {
      newErrors.coverLetter = 'Cover letter must be less than 2000 characters';
    }

    if (!formData.proposedPrice || formData.proposedPrice < 5) {
      newErrors.proposedPrice = 'Proposed price must be at least $5';
    }

    if (!formData.deliveryTime) {
      newErrors.deliveryTime = 'Delivery time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await proposalApi.submitProposal(gig._id, formData);
      toast.success('Proposal submitted successfully!');
      onSubmitted?.();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof ProposalSubmission, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const characterCount = formData.coverLetter.length;
  const isNearLimit = characterCount > 1800;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Submit Proposal</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-1">{gig.title}</h3>
          <p className="text-sm text-gray-600">Budget: ${gig.price}</p>
          <p className="text-sm text-gray-600">Delivery: {gig.deliveryTime} days</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cover Letter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cover Letter *
          </label>
          <textarea
            rows={8}
            value={formData.coverLetter}
            onChange={(e) => handleInputChange('coverLetter', e.target.value)}
            placeholder="Explain why you're the perfect fit for this project. Include relevant experience, approach, and timeline..."
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
              errors.coverLetter ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {errors.coverLetter && (
              <span className="text-red-500 text-sm">{errors.coverLetter}</span>
            )}
            <span className={`text-sm ml-auto ${isNearLimit ? 'text-red-500' : 'text-gray-500'}`}>
              {characterCount}/2000
            </span>
          </div>
        </div>

        {/* Proposed Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Proposed Price *
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              min="5"
              step="0.01"
              value={formData.proposedPrice}
              onChange={(e) => handleInputChange('proposedPrice', parseFloat(e.target.value))}
              className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.proposedPrice ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.proposedPrice && (
            <span className="text-red-500 text-sm mt-1">{errors.proposedPrice}</span>
          )}
          {gig.price && (
            <p className="text-sm text-gray-600 mt-1">
              Client's budget: ${gig.price}
              {formData.proposedPrice > gig.price && (
                <span className="text-orange-600 ml-2">
                  (Above client's budget)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Delivery Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Delivery Time *
          </label>
          <CustomSelect
            value={formData.deliveryTime}
            onChange={(value) => handleInputChange('deliveryTime', value)}
            options={DELIVERY_OPTIONS}
          />
          {errors.deliveryTime && (
            <span className="text-red-500 text-sm mt-1">{errors.deliveryTime}</span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Submitting...
              </div>
            ) : (
              'Submit Proposal'
            )}
          </button>
        </div>
      </form>

      {/* Guidelines */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Proposal Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Be specific about your approach and methodology</li>
          <li>• Highlight relevant experience and past work</li>
          <li>• Explain your timeline and deliverables clearly</li>
          <li>• Be competitive with pricing while valuing your work</li>
          <li>• Show enthusiasm for the project</li>
        </ul>
      </div>
    </div>
  );
}; 