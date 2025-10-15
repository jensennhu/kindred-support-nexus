// src/components/AddPositionModal.tsx
import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';

export interface NewStockPosition {
  symbol: string;
  price: string;
  position: 'holding' | 'sold' | 'watching';
  strategy: string;
  category: string;
  date: string;
  risk_level: number;
  position_size: number;
}

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (position: NewStockPosition) => Promise<void>;
  loading?: boolean;
  error?: string;
}

const initialPosition: NewStockPosition = {
  symbol: '',
  price: '',
  position: 'watching',
  strategy: 'General',
  category: 'General',
  date: new Date().toISOString().split('T')[0],
  risk_level: 50,
  position_size: 0
};

export const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  loading = false,
  error
}) => {
  const [position, setPosition] = useState<NewStockPosition>(initialPosition);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPosition({
        ...initialPosition,
        date: new Date().toISOString().split('T')[0],
        risk_level: 50,
        position_size: 0
      });
      setValidationErrors({});
    }
  }, [isOpen]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!position.symbol.trim()) {
      errors.symbol = 'Stock symbol is required';
    } else if (!/^[A-Z]{1,5}$/.test(position.symbol.trim().toUpperCase())) {
      errors.symbol = 'Symbol must be 1-5 uppercase letters';
    }

    const price = parseFloat(position.price);
    if (!position.price.trim()) {
      errors.price = 'Price is required';
    } else if (isNaN(price) || price <= 0) {
      errors.price = 'Price must be a positive number';
    } else if (price > 999999) {
      errors.price = 'Price cannot exceed $999,999';
    }

    if (!position.strategy.trim()) {
      errors.strategy = 'Strategy is required';
    } else if (position.strategy.length > 50) {
      errors.strategy = 'Strategy cannot exceed 50 characters';
    }

    if (!position.date) {
      errors.date = 'Date is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      await onSubmit({
        ...position,
        symbol: position.symbol.toUpperCase().trim(),
        strategy: position.strategy.trim(),
        price: parseFloat(position.price).toFixed(2)
      });
      onClose();
    } catch (error) {
      // Error is handled by parent component
      console.error('Failed to add position:', error);
    }
  };

  const handleInputChange = (field: keyof NewStockPosition, value: string) => {
    setPosition(prev => ({ ...prev, [field]: value }));
    
    // Clear field-specific validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full border border-gray-200 shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add Stock Position</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={loading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Stock Symbol*
            </label>
            <input
              type="text"
              value={position.symbol}
              onChange={(e) => handleInputChange('symbol', e.target.value.toUpperCase())}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                validationErrors.symbol ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="e.g., AAPL"
              maxLength={5}
              disabled={loading}
            />
            {validationErrors.symbol && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.symbol}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Current Price*
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="999999"
              value={position.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                validationErrors.price ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
              disabled={loading}
            />
            {validationErrors.price && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Position Size
            </label>
            <input
              type="number"
              step="100"
              min="0"
              value={position.position_size}
              onChange={(e) => setPosition(prev => ({ ...prev, position_size: parseFloat(e.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              placeholder="0"
              disabled={loading}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Position
              </label>
              <select
                value={position.position}
                onChange={(e) => handleInputChange('position', e.target.value as 'holding' | 'sold' | 'watching')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
                disabled={loading}
              >
                <option value="watching">Watching</option>
                <option value="holding">Holding</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">
                Strategy
              </label>
              <input
                type="text"
                value={position.strategy}
                onChange={(e) => handleInputChange('strategy', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                  validationErrors.strategy ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g. Crypto, LEAPS, Swing Trade"
                maxLength={50}
                disabled={loading}
              />
              {validationErrors.strategy && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.strategy}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Category
            </label>
            <input
              type="text"
              value={position.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
              placeholder="e.g. Tech, Healthcare"
              maxLength={50}
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Date*
            </label>
            <input
              type="date"
              value={position.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900 ${
                validationErrors.date ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading}
            />
            {validationErrors.date && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.date}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Risk Level: {position.risk_level}
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={position.risk_level}
              onChange={(e) => setPosition(prev => ({ ...prev, risk_level: parseInt(e.target.value) }))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(120, 70%, 50%) 0%, hsl(60, 70%, 50%) 50%, hsl(0, 70%, 50%) 100%)`
              }}
              disabled={loading}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={loading}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Position
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};