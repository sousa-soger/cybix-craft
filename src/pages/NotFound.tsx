import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";

const NotFound = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-surface p-6">
      <div className="section-card p-10 text-center max-w-md w-full">
        <div className="flex justify-center mb-6"><Logo /></div>
        <div className="text-6xl font-semibold brand-gradient-text tracking-tight">404</div>
        <p className="mt-3 text-sm text-muted-foreground">This pipeline doesn't exist. Maybe it was rolled back?</p>
        <Link to="/" className="inline-block mt-6">
          <Button variant="brand">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
