import { Navigate, Outlet, useLocation } from "react-router";

export function ProtectedRoute() {
    const location = useLocation();
    const token = localStorage.getItem("derm_token");

    if (!token) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    return <Outlet />;
}