import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default function Home() {
  const { userId } = auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white">
      <h1 className="text-5xl font-bold mb-4">MindFlow</h1>
      <p className="text-gray-400 text-xl mb-8">
        Beat burnout. Learn smarter. Build habits.
      </p>
      <div className="flex gap-4">
        <Link
          href="/sign-in"
          className="bg-indigo-600 hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold"
        >
          Sign In
        </Link>
        <Link
          href="/sign-up"
          className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold"
        >
          Sign Up
        </Link>
      </div>
    </main>
  );
}
