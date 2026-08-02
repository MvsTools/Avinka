import type { Metadata } from "next";
import ThemaPagina from "../ThemaPagina";
import { themaVoor } from "../themas";

const THEMA = themaVoor("riso")!;

export const metadata: Metadata = {
  title: "Avinka · variant Riso",
  description: THEMA.eenRegel,
};

export default function Pagina() {
  return <ThemaPagina thema={THEMA} />;
}
