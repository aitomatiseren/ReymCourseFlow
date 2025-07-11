
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function CertificateExpiry() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the certifications page with the expiry tab
    navigate("/certifications");
  }, [navigate]);

  return null;
}
