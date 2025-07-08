import React from 'react';

const Header: React.FC = () => (
  <header className="glass-card rounded-2xl mb-8 p-6 mx-4 mt-4">
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 gradient-secondary rounded-xl flex items-center justify-center text-white font-bold text-lg">
          CC
        </div>
        <div className="text-2xl font-bold text-primary">
          CoachCatalyst
        </div>
      </div>
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-200 bg-opacity-50 rounded-xl cursor-not-allowed opacity-60">
        <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-semibold text-sm">
          🔒
        </div>
        <span className="text-gray-600 font-medium">Signup Coming Soon!</span>
      </div>
    </div>
  </header>
);

export default Header;