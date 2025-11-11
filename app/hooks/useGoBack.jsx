import { useLocation, useNavigate } from "react-router-dom";

export function useGoBack(fallback = "/app") {
  const navigate = useNavigate();
  const location = useLocation();

  return () => {
    if (location.key !== "default") {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}
