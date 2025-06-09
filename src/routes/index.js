import { createBrowserRouter, Navigate } from "react-router-dom";
import ManagementClauseSample from "../pages/ManagementClauseSample";
import ManagementContractToProcess from "../pages/ManagementContractToProcess";
import ChatContract from "../pages/ChatContract";
import CompareContractNew from "../pages/CompareContractNew";

const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/compare-contract" />,
      },
      {
        path:'compare-contract',
        element: <CompareContractNew/>
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
      },
])

export default router