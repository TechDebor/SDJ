import React, { useState } from 'react';
import { Calculator } from 'lucide-react';
import JewelryCalculator from './JewelryCalculator';

export default function CalculatorLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-900/30 transition-transform hover:scale-110 active:scale-95"
        title="Article Price Calculator"
      >
        <Calculator className="h-6 w-6" />
      </button>

      {/* Calculator Modal */}
      {open && <JewelryCalculator onClose={() => setOpen(false)} />}
    </>
  );
}
