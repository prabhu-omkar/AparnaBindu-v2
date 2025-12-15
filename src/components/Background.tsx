import React from 'react';

const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 -z-50">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50"></div>
      
      {/* Animated Background Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2392400e' fill-opacity='0.4'%3E%3Ccircle fill='%2392400e' cx='20' cy='20' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundAttachment: 'fixed'
        }}
      />
    </div>
  );
};

export default Background;
