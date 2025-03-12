import React, { memo } from "react";

interface UserCounterProps {
  totalUsers: number;
}

const UserCounter: React.FC<UserCounterProps> = ({ totalUsers }) => {
  return (
    <div className="absolute top-5 right-12 z-50 p-2 px-3 bg-[#1a2a36]/90 backdrop-blur-md border-2 border-[#78C0A8] rounded-md shadow-md">
      <div className="text-[#78C0A8] font-medium">
        <span className="font-bold">{totalUsers}</span> Live Users
      </div>
    </div>
  );
};

// Memoize to prevent re-renders when other parts of map change
export default memo(UserCounter);
