"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCity } from "@/store/slices/filterSlice";
import DiscoverClient from "@/app/discover/DiscoverClient";

export default function CityClient({ city }: { city: string }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(setCity(city));
  }, [city, dispatch]);
  
  return <DiscoverClient />;
}
