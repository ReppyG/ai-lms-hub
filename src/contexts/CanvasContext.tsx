import { createContext, useContext, ReactNode } from "react";
import { useCanvas, CanvasCourse, CanvasAssignment } from "@/hooks/useCanvas";

interface CanvasContextType {
  courses: CanvasCourse[];
  assignments: CanvasAssignment[];
  loading: boolean;
  refetch: () => void;
}

const CanvasContext = createContext<CanvasContextType | undefined>(undefined);

export const CanvasProvider = ({ children }: { children: ReactNode }) => {
  const canvasData = useCanvas();

  return (
    <CanvasContext.Provider value={canvasData}>
      {children}
    </CanvasContext.Provider>
  );
};

export const useCanvasContext = () => {
  const context = useContext(CanvasContext);
  if (context === undefined) {
    throw new Error("useCanvasContext must be used within a CanvasProvider");
  }
  return context;
};
