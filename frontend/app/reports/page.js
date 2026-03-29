"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import PersonalReport from "@/components/PersonalReport";
import Link from "next/link";
import { useEffect } from "react";

export default function ReportsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MindFlow</h1>
            <p className="text-sm text-gray-600">
              Personal Analytics & Reports
            </p>
          </div>
          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/reports"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.firstName || "friend"}! 👋
          </h2>
          <p className="text-gray-600">
            Here's your comprehensive personal analytics report. Track your
            progress, stay aware of burnout signals, and maintain your momentum.
          </p>
        </div>

        {/* Personal Report Component */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <PersonalReport userId={user.id} />
        </div>

        {/* Footer Actions */}
        <div className="mt-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            What&apos;s next?
          </h3>
          <ul className="space-y-1 text-sm text-gray-700 mb-4">
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>
                Review your energy trends and adjust your schedule if needed
              </span>
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>Continue logging daily wins and check-ins</span>
            </li>
            <li className="flex items-center gap-2">
              <span>✓</span>
              <span>
                Check back weekly to monitor your overall wellness score
              </span>
            </li>
          </ul>
          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-semibold"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => window.print?.()}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold"
            >
              Print Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
