import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { SessionProvider } from "./context/SessionContext";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                <RouterProvider router={router} />
                {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </SessionProvider>
        </QueryClientProvider>
    );
}

export default App;
