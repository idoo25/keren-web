import React from 'react';

const Tabs = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'welcome', label: 'Welcome' },
    { id: 'interview', label: 'New Interview' },
    { id: 'history', label: 'Interview History' },
  ];

  return (
    <div className="relative flex justify-center space-x-4 mb-6 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 p-1 rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`relative px-4 py-2 text-sm sm:text-lg font-semibold rounded-lg text-white transition-transform duration-300 transform ${
            activeTab === tab.id
              ? 'bg-gradient-to-r to-purple-200 text-purple-700 scale-105'
              : 'hover:scale-105 hover:bg-white/20'
          }`}
        >
          {tab.label}

          {/* Add animated underline effect */}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-1 bg-purple-700 rounded-full"></span>
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
