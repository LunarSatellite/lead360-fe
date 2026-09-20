import { createBrowserRouter } from 'react-router-dom';
import { routeObjects } from './route-table';

// The route table lives in ./route-table so it can be imported without this
// side effect: `createBrowserRouter` begins navigating as soon as it is
// constructed, which is not something a reader of the routes wants to trigger.
export { routeObjects };

// Served from a sub-path when the console is deployed alongside the API on one
// origin (which is how it avoids CORS entirely). Vite sets BASE_URL from the
// --base it was built with, so this is '/' for a root deployment and
// '/console/' for a sub-path one, and the two stay in step automatically -
// setting Vite's base without the router's basename gives you an app whose
// assets load and whose every route 404s.
export const router = createBrowserRouter(routeObjects, {
  basename: import.meta.env.BASE_URL,
});
