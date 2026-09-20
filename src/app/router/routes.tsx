import { createBrowserRouter } from 'react-router-dom';
import { routeObjects } from './route-table';

// The route table lives in ./route-table so it can be imported without this
// side effect: `createBrowserRouter` begins navigating as soon as it is
// constructed, which is not something a reader of the routes wants to trigger.
export { routeObjects };

export const router = createBrowserRouter(routeObjects);
