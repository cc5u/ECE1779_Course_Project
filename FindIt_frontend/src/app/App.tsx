import { RouterProvider } from 'react-router';
import { router } from './routes';


export default function App() {
  return <RouterProvider router={router} />;
}

// This component is the root of your application. 
// You can add global providers here, such as context providers or state management providers.