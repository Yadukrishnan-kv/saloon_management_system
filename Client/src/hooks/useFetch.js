import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const useFetch = (url, options = {}) => {
  const backendUrl = process.env.REACT_APP_BACKEND_IP;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { immediate = true, params = {} } = options;

  const fetchData = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const resolvedUrl = url.startsWith("http") ? url : `${backendUrl}${url}`;
      const { data: responseData } = await axios.get(resolvedUrl, {
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
