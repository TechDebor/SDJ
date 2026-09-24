import React, { useState } from 'react';
import { 
  Calculator, 
  Scale, 
  IndianRupee, 
  Percent, 
  Diamond,
  Receipt,
  RotateCcw
} from 'lucide-react';

export default function JewelryCalculator({ onClose }) {
  // State for all inputs
  const [metalRate, setMetalRate] = useState(''); // Rate per 10g
  const [weight, setWeight] = useState(''); // Weight in grams
  const [makingChargeType, setMakingChargeType] = useState('percent'); // 'percent' or 'perGram' or 'flat'
  const [makingChargeValue, setMakingChargeValue] = useState('');
  const [extraCharges, setExtraCharges] = useState(''); // Stones, hallmark, etc.
  const [gstRate, setGstRate] = useState(3); // Default GST for jewelry in India is 3%

  // Derived calculations (calculated automatically on every render)
  const numMetalRate = parseFloat(metalRate) || 0;
  const numWeight = parseFloat(weight) || 0;
  const numMakingCharge = parseFloat(makingChargeValue) || 0;
  const numExtra = parseFloat(extraCharges) || 0;

  // 1. Calculate base metal value
  const ratePerGram = numMetalRate / 10;
  const baseMetalValue = ratePerGram * numWeight;

  // 2. Calculate making charges
  let totalMakingCharges = 0;
  if (makingChargeType === 'percent') {
    totalMakingCharges = (baseMetalValue * numMakingCharge) / 100;
  } else if (makingChargeType === 'perGram') {
    totalMakingCharges = numMakingCharge * numWeight;
  } else if (makingChargeType === 'flat') {
    totalMakingCharges = numMakingCharge;
  }

  // 3. Calculate subtotal (Metal + Making + Extra)
  const subTotal = baseMetalValue + totalMakingCharges + numExtra;

  // 4. Calculate GST and Final Amount
  const gstAmount = (subTotal * gstRate) / 100;
  const grandTotal = subTotal + gstAmount;

  // Helper to format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(amount);
  };

  const handleReset = () => {
    setMetalRate('');
    setWeight('');
    setMakingChargeValue('');
    setExtraCharges('');
    setGstRate(3);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose?.() }}>
      <div className="w-full max-w-md mx-auto bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden flex flex-col font-sans max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-amber-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Diamond size={24} className="text-white" />
            <h2 className="text-lg font-bold tracking-wide shadow-sm">
              Shri Darshan Jewellers
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <Calculator size={20} className="opacity-80" />
            <button onClick={() => onClose?.()} className="p-1 hover:bg-amber-600 rounded-full transition-colors" title="Close Calculator">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>
        
        <div className="bg-amber-50 py-2 px-4 text-xs font-semibold text-amber-800 border-b border-amber-100 uppercase tracking-wider text-center">
          Article Price Calculator
        </div>

        {/* Input Section */}
        <div className="p-5 space-y-4 flex-grow overflow-y-auto">
          
          {/* Metal Rate */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase flex items-center">
              <IndianRupee size={12} className="mr-1" /> Today's Rate (per 10g)
            </label>
            <input 
              type="number" 
              placeholder="e.g. 72000"
              value={metalRate}
              onChange={(e) => setMetalRate(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Weight */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase flex items-center">
              <Scale size={12} className="mr-1" /> Gross Weight (Grams)
            </label>
            <input 
              type="number" 
              placeholder="e.g. 15.500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

          {/* Making Charges */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 uppercase">Making Charges</label>
              <div className="flex bg-slate-50 rounded-lg p-0.5 border border-slate-200">
                <button 
                  onClick={() => setMakingChargeType('percent')}
                  className={`text-xs px-2 py-1 rounded-lg ${makingChargeType === 'percent' ? 'bg-white shadow-sm font-bold text-amber-600' : 'text-slate-500'}`}
                >
                  %
                </button>
                <button 
                  onClick={() => setMakingChargeType('perGram')}
                  className={`text-xs px-2 py-1 rounded-lg ${makingChargeType === 'perGram' ? 'bg-white shadow-sm font-bold text-amber-600' : 'text-slate-500'}`}
                >
                  /g
                </button>
                <button 
                  onClick={() => setMakingChargeType('flat')}
                  className={`text-xs px-2 py-1 rounded-lg ${makingChargeType === 'flat' ? 'bg-white shadow-sm font-bold text-amber-600' : 'text-slate-500'}`}
                >
                  Flat
                </button>
              </div>
            </div>
            <div className="relative">
              {makingChargeType === 'percent' && <Percent size={14} className="absolute left-3 top-3 text-slate-400" />}
              {makingChargeType !== 'percent' && <IndianRupee size={14} className="absolute left-3 top-3 text-slate-400" />}
              <input 
                type="number" 
                placeholder={`Enter ${makingChargeType === 'percent' ? 'Percentage' : 'Amount'}`}
                value={makingChargeValue}
                onChange={(e) => setMakingChargeValue(e.target.value)}
                className="w-full p-2 pl-8 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Extra Charges */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase">
              Extra Charges (Stone / Hallmark)
            </label>
            <input 
              type="number" 
              placeholder="Total Extra Rs"
              value={extraCharges}
              onChange={(e) => setExtraCharges(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
            />
          </div>

        </div>

        {/* Summary / Result Section */}
        <div className="bg-slate-50 border-t border-slate-200 p-5 space-y-3 relative shrink-0">
          <button 
            onClick={handleReset}
            className="absolute top-4 right-4 text-slate-400 hover:text-red-500 transition-colors flex items-center text-xs"
            title="Reset Calculator"
          >
            <RotateCcw size={14} className="mr-1" /> Reset
          </button>
          
          <h3 className="text-sm font-bold text-slate-700 uppercase flex items-center mb-4">
            <Receipt size={16} className="mr-2" /> Billing Summary
          </h3>

          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between">
              <span>Metal Value ({(ratePerGram || 0).toFixed(2)}/g)</span>
              <span className="font-medium text-slate-800">{formatCurrency(baseMetalValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Making Charges</span>
              <span className="font-medium text-slate-800">+ {formatCurrency(totalMakingCharges)}</span>
            </div>
            {numExtra > 0 && (
              <div className="flex justify-between">
                <span>Extra / Stones</span>
                <span className="font-medium text-slate-800">+ {formatCurrency(numExtra)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-slate-800">
              <span>Subtotal</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>GST Amount</span>
              <div className="flex items-center space-x-2">
                <input 
                  type="number" 
                  value={gstRate} 
                  onChange={(e) => setGstRate(e.target.value)}
                  className="w-12 text-center p-0.5 border border-slate-200 rounded-lg bg-white"
                />
                <span>%</span>
              </div>
            </div>
            <div className="flex justify-between text-slate-600 pb-2">
              <span>GST Tax</span>
              <span className="font-medium text-slate-800">+ {formatCurrency(gstAmount)}</span>
            </div>
          </div>

          {/* Grand Total */}
          <div className="bg-amber-100 p-4 rounded-2xl flex justify-between items-center border border-amber-200 shadow-sm mt-2">
            <span className="text-amber-900 font-bold uppercase tracking-wider text-sm">Grand Total</span>
            <span className="text-amber-900 font-black text-xl">{formatCurrency(grandTotal)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
