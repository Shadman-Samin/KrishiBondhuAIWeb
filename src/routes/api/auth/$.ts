import { createFileRoute } from "@tanstack/react-router";
import { getAuth } from "@/lib/auth";

// Ponytail: catch-all API route for Better Auth endpoints.
// TanStack Start file-based routing auto-generates the route tree,
// but API catch-all "$" routes need explicit handler registration.
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return await getAuth().handler(request);
      },
      POST: async ({ request }: { request: Request }) => {
        return await getAuth().handler(request);
      },
    },
  },
});
