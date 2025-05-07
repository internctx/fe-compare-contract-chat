import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../compoments/Login";
import ChatBot from "../compoments/ChatBot";
// import PrivateRoute from "../compoments/PrivateRoutes";
import BotManagement from "../compoments/BotManagement";
import CompareContract from "../compoments/CompareContract";
import ManagementClauseSample from "../compoments/ManagementClauseSample";
import ManagementContractToProcess from "../compoments/ManagementContractToProcess";
import ChatContract from "../compoments/ChatContract";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/chatbot" />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/chatbot',
        element: (
            // <PrivateRoute>
              <ChatBot />
            // </PrivateRoute>
          ),
      }, 
      {
        path: 'bot-management',
        element: <BotManagement/>
      },
      {
        path:'compare-contract',
        element: <CompareContract/>
      },
      {
        path: 'manage-clause',
        element: <ManagementClauseSample/>
      },
      {
        path: 'manage-contract',
        element: <ManagementContractToProcess/>
      },
      {
        path: 'chat-contract',
        element: <ChatContract/>
      }
])

export default router