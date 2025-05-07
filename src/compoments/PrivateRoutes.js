import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log('Current Cookies:', document.cookie);
                const response = await fetch(
                    // "https://3rd-jira-plugin-d3dwb7ckb2b2fmhp.southindia-01.azurewebsites.net/api/v1/check-auth", 
                    "http://localhost:5003/api/v1/check-auth",
                {
                    method: 'GET',
                    credentials: 'include', // Gửi cookie session kèm theo yêu cầu
                });
                
                console.log('Response Status:', response.status);
                const responseText = await response.text();
                console.log('Response Message:', responseText);
                
                if (response.ok) {
                    const data = JSON.parse(responseText);
                    setIsAuthenticated(data.isAuthenticated);
                } else {
                    setIsAuthenticated(false);
                    // Bạn có thể xử lý thông báo cho người dùng tại đây
                    console.warn('Not authenticated:', response.status);
                }
            } catch (error) {
                console.error('Error checking authentication:', error);
                setIsAuthenticated(false);
            }
        };

        checkAuth(); 
    }, []);

    if (isAuthenticated === null) {
        return <div>Loading...</div>;
    }

    return isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
