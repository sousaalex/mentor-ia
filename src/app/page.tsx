"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SiRotaryinternational } from "react-icons/si";
import { ImSpinner2 } from "react-icons/im";
import { Spin } from "antd";

import "./globals.css";
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/home");
  }, []);

  return (
    <div className="w-full h-full fixed top-0 left-0 flex justify-center items-center">
      <div className="flex justify-center items-center text-center space-x-2">
        <Spin size="small" />
      </div>
    </div>
  );
}
