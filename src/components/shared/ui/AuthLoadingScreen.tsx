import React from "react";

const AuthLoadingScreen: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
    <div className="text-white text-2xl animate-pulse">
      Checking authentication...
    </div>
  </div>
);

export default AuthLoadingScreen;
