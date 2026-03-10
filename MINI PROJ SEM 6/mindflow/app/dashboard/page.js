import AiAssistant from "@/components/AiAssistant";
import BurnoutCard from "@/components/BurnoutCard";
import MicroLog from "@/components/MicroLog";
import CheckinPopup from "@/components/CheckinPopup";
import FocusTimer from "@/components/FocusTimer";
import TaskManager from "@/components/TaskManager";
import { BrainCircuit } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 font-sans">
      <header className="mb-10 flex items-center gap-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
          <BrainCircuit className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tighter bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
            MindFlow
          </h1>
          <p className="text-sm text-gray-500 font-medium">Your personal cognitive dashboard</p>
        </div>
      </header>
      
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto">
        {/* Left Column (Takes up 7 columns on large screens) */}
        <div className="lg:col-span-7 flex flex-col gap-6" id="dashboard">
          <AiAssistant />
          <div id="tasks" className="scroll-mt-6">
            <TaskManager />
          </div>
        </div>

        {/* Right Column (Takes up 5 columns on large screens) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div id="focus" className="scroll-mt-6">
            <FocusTimer />
          </div>
          <BurnoutCard />
          <MicroLog />
        </div>
      </main>

      <CheckinPopup />
    </div>
  );
}
