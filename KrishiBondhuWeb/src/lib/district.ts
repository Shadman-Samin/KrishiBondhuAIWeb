import { useEffect, useState } from "react";

const DISTRICT_KEY = "kb_user_district";
export const DEFAULT_DISTRICT = "Comilla";

export function useDistrict(): [string, (district: string) => void] {
  const [district, setDistrictState] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDistrictState(localStorage.getItem(DISTRICT_KEY) ?? DEFAULT_DISTRICT);
    } catch {
      setDistrictState(DEFAULT_DISTRICT);
    }
  }, []);

  const setDistrict = (d: string) => {
    setDistrictState(d);
    try {
      localStorage.setItem(DISTRICT_KEY, d);
    } catch {
      /* ignore */
    }
  };

  return [district ?? DEFAULT_DISTRICT, setDistrict];
}
