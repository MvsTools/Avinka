import Image from "next/image";

// Het Avinka-logo. Twee strak bijgesneden versies (geen transparante rand):
//  - standaard = woordmerk "avinka" met de groene ✓ (voor headers/nav).
//  - vol = het volledige logo mét tagline "Van to-do naar gedaan" (grote plekken,
//    bijv. de login).
// Hoogte bepaal je met className (bijv. "h-10 w-auto").
export default function Logo({
  className = "h-10 w-auto",
  vol = false,
  priority = false,
}: {
  className?: string;
  vol?: boolean;
  priority?: boolean;
}) {
  const src = vol ? "/Avinka_logo.png" : "/Avinka_wordmerk.png";
  const [w, h] = vol ? [1188, 465] : [1188, 321];
  return (
    <Image src={src} alt="Avinka" width={w} height={h} priority={priority} className={className} />
  );
}
