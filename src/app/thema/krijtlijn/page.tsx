import type { Metadata } from "next";
import ThemaPagina from "../ThemaPagina";
import { themaVoor } from "../themas";

const THEMA = themaVoor("krijtlijn")!;

export const metadata: Metadata = {
  title: "Avinka · variant Krijtlijn",
  description: THEMA.eenRegel,
};

export default function Pagina() {
  return <ThemaPagina thema={THEMA} />;
}
