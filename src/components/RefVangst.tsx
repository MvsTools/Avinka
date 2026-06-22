"use client";

import { useEffect } from "react";

// Vangt de uitnodigingscode uit de link (/sign-up?ref=CODE) op en bewaart 'm
// even lokaal, zodat hij na het registreren aan de uitnodiger gekoppeld kan worden.
export default function RefVangst() {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) localStorage.setItem("avinka_ref", ref.trim().slice(0, 32));
    } catch {
      /* niets */
    }
  }, []);
  return null;
}
