import { RouterProvider } from "react-router";
import { AppProvider } from "./context/AppContext";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { StudyTimerWidget } from "./components/StudyTimerWidget";
import { TimerProvider } from "./timer/TimerContext";
import React from "react";

export default function App() {
  return (
    <AppProvider>
      <TimerProvider>
        <RouterProvider router={router} />
        <StudyTimerWidget />
        <Toaster />
      </TimerProvider>
    </AppProvider>
  );
}
