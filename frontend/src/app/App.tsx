import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "ice-ds";
import { RouterProvider } from "react-router";

import { queryClient } from "../lib/queryClient";
import { router } from "./router";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
