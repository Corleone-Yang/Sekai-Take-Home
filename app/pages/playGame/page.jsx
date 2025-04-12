"use client";

import Sidebar from "../../components/Sidebar";

export default function PlayGame() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 main-content">
        <div className="p-8">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Play Game</h1>
        </div>
      </main>
    </div>
  );
}
