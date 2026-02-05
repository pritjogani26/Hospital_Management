import axios from "axios";
import React, { useCallback } from "react";
import api from "../api/axios";

export const debounce = (func: Function, waitFor: number) => {
  let timeout: any = null;

  const debounced = (...args: any) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced;
};

const SearchBar = () => {
  const serchPatient = useCallback(
    debounce(async (value: any) => {
      try {
        let response = api.get(`/patients/display/search?query=${value}`);
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    }, 500),
    [],
  );

  return serchPatient;
};

export default SearchBar;
