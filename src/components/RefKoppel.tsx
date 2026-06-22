"use client";

import { useEffect } from "react";
import { koppelVerwijzing } from "@/lib/db";

// Koppelt na het inloggen eenmalig de opgeslagen uitnodigingscode aan je account
// (de db-functie doet niets als je al gekoppeld bent of je eigen code gebruikt).
export default function RefKoppel() {
  useEffect(() => {
    let ref: string | null = null;
    try {
      ref = localStorage.getItem("wijs_ref");
    } catch {
      /* niets */
    }
    if (!ref) return;
    koppelVerwijzing(ref).finally(() => {
      try {
        localStorage.removeItem("wijs_ref");
      } catch {
        /* niets */
      }
    });
  }, []);
  return null;
}
