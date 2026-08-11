"use client";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCategory } from "@/store/slices/filterSlice";
import DiscoverClient from "@/app/discover/DiscoverClient";

export default function CategoryClient({ category }: { category: string }) {
  const dispatch = useDispatch();
  
  useEffect(() => {
    dispatch(setCategory(category));
  }, [category, dispatch]);
  
  return <DiscoverClient />;
}
