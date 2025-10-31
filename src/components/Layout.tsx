import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { FloatingAIAssistant } from "./FloatingAIAssistant";
import { ThemeToggle } from "./ThemeToggle";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
      <FloatingAIAssistant />
      <div className="fixed bottom-4 left-4 z-40">
        <ThemeToggle />
      </div>
    </div>
  );
};
