'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-lg text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Test Page</h1>
        <p className="text-gray-600">If you can see this, Next.js is working correctly!</p>
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <p className="text-blue-700">Try visiting <a href="/draw" className="underline">/draw</a> for the drawing canvas.</p>
        </div>
      </div>
    </div>
  );
}
