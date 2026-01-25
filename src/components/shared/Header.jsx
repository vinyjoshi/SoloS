import React from 'react';

const Header = ({ user, onLogout }) => {
  return (
    <header className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <h1 className="text-xl font-bold">SolOS</h1>
      {user && (
        <div className="flex items-center">
          <span className="mr-4">Welcome, {user.name}</span>
          <button onClick={onLogout} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default Header;