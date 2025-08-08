"use client";

import { useEffect } from "react";

import { socket } from "@/lib/socket";

const HomePage = () => {
  useEffect(() => {
    socket.on("connect", () => {
      console.log("connected to server");
    });
    return () => {
      socket.off("connect");
    };
  }, []);
  return (
    <div>HomePage</div>
  );
}

export default HomePage;