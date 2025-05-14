import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "TeleInteruv – Interview Lobby",
};

export default function InterviewLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-neutral-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h1 className="text-xl font-semibold">TeleInteruv AI Interview</h1>
        <Button variant="secondary">End Session</Button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1 flex">
          {children}
        </ScrollArea>
      </main>
    </div>
  );
}