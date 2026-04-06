import { useState, useEffect, useCallback } from "react";
import api from "../utils/api";

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { immediate = true, params = {} } = options;

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const { data: responseData } = await api.get(url, {
        params: overrideParams || params,
      });
      setData(responseData);
      return responseData;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Something went wrong";
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [immediate, fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export default useFetch;
