import {
  AbsoluteFill,
  Sequence,
  Img,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { loadFont as loadJakarta } from "@remotion/google-fonts/PlusJakartaSans";

const { fontFamily: SERIF } = loadFraunces();
const { fontFamily: SANS } = loadJakarta();

const CREAM = "#fbf6ee";
const INK = "#221c3a";
const GREEN = "#2f9e6e";
const GREEN2 = "#25855a";
const MUTED = "#6b6880";
const SOFT = "#eadfce";

const useIn = (delay = 0, damping = 16) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping, mass: 0.7 } });
};
const Rise: React.FC<{ delay?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay = 0, y = 26, children, style }) => {
  const s = useIn(delay);
  return <div style={{ opacity: Math.min(1, s), transform: `translateY(${(1 - s) * y}px)`, ...style }}>{children}</div>;
};
const Box: React.FC<{ bg: string; dur: number; children: React.ReactNode }> = ({ bg, dur, children }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [0, 12, dur - 15, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ background: bg, alignItems: "center", justifyContent: "center", fontFamily: SANS, opacity: op }}>{children}</AbsoluteFill>;
};

const TAKEN = [
  "Nakijken", "Lessen voorbereiden", "Toetsen analyseren", "Rapporten schrijven",
  "Ouderbrieven", "Verslagen bijwerken", "Handelingsplannen", "Cijfers invoeren",
  "Weekplanning maken", "Differentiatie", "Oudergesprekken", "Groepsplan",
];

// Taak-rij met vinkje
const Taak: React.FC<{ tekst: string; af?: boolean; afDelay?: number }> = ({ tekst, af, afDelay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const check = af ? spring({ frame: frame - afDelay, fps, config: { damping: 12 } }) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "13px 20px", borderBottom: `1px solid ${SOFT}` }}>
      <div style={{ width: 30, height: 30, borderRadius: 9, border: `2.5px solid ${check > 0.1 ? GREEN : "#cdbfa8"}`, background: check > 0.1 ? GREEN : "#fff", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 18, transform: `scale(${0.9 + check * 0.15})` }}>
        {check > 0.4 ? "✓" : ""}
      </div>
      <div style={{ fontSize: 26, fontWeight: 600, color: check > 0.4 ? MUTED : INK, textDecoration: check > 0.6 ? "line-through" : "none" }}>{tekst}</div>
    </div>
  );
};

// 1 — De overvolle to-do-lijst (het effect)
const Overvol: React.FC = () => {
  const frame = useCurrentFrame();
  const zichtbaar = Math.min(TAKEN.length, Math.floor(interpolate(frame, [10, 150], [0, TAKEN.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })));
  const schud = frame > 120 ? Math.sin(frame * 0.9) * interpolate(frame, [120, 160], [0, 3], { extrapolateRight: "clamp" }) : 0;
  const teller = Math.max(0, zichtbaar) * 3 + 4;
  return (
    <Box bg={CREAM} dur={240}>
      <div style={{ textAlign: "center" }}>
        <Rise><h1 style={{ fontFamily: SERIF, fontSize: 58, color: INK, margin: "0 0 8px", fontWeight: 600 }}>Als leerkracht is je to-do-lijst <span style={{ color: GREEN, fontStyle: "italic" }}>nooit leeg</span>.</h1></Rise>
        <Rise delay={10}><div style={{ fontSize: 24, color: MUTED, marginBottom: 30 }}>En hij kost je meer tijd dan je zou willen.</div></Rise>
        <div style={{ width: 720, margin: "0 auto", background: "#fff", borderRadius: 22, boxShadow: "0 30px 70px rgba(34,28,58,.16)", border: `1px solid ${SOFT}`, overflow: "hidden", transform: `translateX(${schud}px)` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 22px", background: "#f6f1e8", borderBottom: `1px solid ${SOFT}` }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 26, color: INK }}>📋 Te doen</div>
            <div style={{ fontWeight: 800, fontSize: 20, color: frame > 90 ? "#c0392b" : MUTED }}>{teller} taken</div>
          </div>
          <div style={{ maxHeight: 430, overflow: "hidden", position: "relative" }}>
            {TAKEN.slice(0, zichtbaar).map((t, i) => <Taak key={i} tekst={t} />)}
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 90, background: "linear-gradient(transparent,#fff)" }} />
          </div>
        </div>
      </div>
    </Box>
  );
};

// 2 — Avinka, gemaakt door een leerkracht
const Intro: React.FC = () => {
  const s = useIn(4, 15);
  return (
    <Box bg={CREAM} dur={150}>
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: Math.min(1, s), transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})` }}>
          <Img src={staticFile("Avinka_logo_transparant.png")} style={{ width: 460, height: "auto" }} />
        </div>
        <Rise delay={22}><div style={{ fontSize: 30, color: INK, marginTop: 26, fontWeight: 600, maxWidth: 900 }}>Een <b style={{ color: GREEN2 }}>AI-gestuurd platform</b> dat je helpt met precies dát werk.</div></Rise>
        <Rise delay={34}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginTop: 22, background: "#fff", border: `1px solid ${SOFT}`, borderRadius: 999, padding: "8px 8px 8px 20px", boxShadow: "0 10px 26px rgba(34,28,58,.08)" }}>
            <span style={{ fontWeight: 700, color: MUTED, fontSize: 20 }}>Gemaakt door een leerkracht</span>
            <div style={{ width: 46, height: 46, borderRadius: "50%", overflow: "hidden" }}><Img src={staticFile("Michael.jpg")} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          </div>
        </Rise>
      </div>
    </Box>
  );
};

// 3 — Product in beweging: rapport schrijft zichzelf
const RapportScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const tekst = "Sofie heeft zich dit blok knap ontwikkeld. Ze werkt zelfstandig, durft vragen te stellen en helpt anderen graag. Bij rekenen groeit haar zelfvertrouwen zichtbaar.";
  const n = Math.floor(interpolate(frame, [20, 140], [0, tekst.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const klaar = spring({ frame: frame - 150, fps, config: { damping: 12 } });
  const s = useIn(0, 18);
  return (
    <Box bg={CREAM} dur={180}>
      <div style={{ textAlign: "center" }}>
        <Rise><h2 style={{ fontFamily: SERIF, fontSize: 44, color: INK, margin: "0 0 26px", fontWeight: 600 }}>Veel van je administratie kan <span style={{ color: GREEN, fontStyle: "italic" }}>makkelijker en sneller</span></h2></Rise>
        <div style={{ width: 900, margin: "0 auto", background: "#fff", borderRadius: 20, boxShadow: "0 34px 80px rgba(34,28,58,.2)", border: `1px solid ${SOFT}`, overflow: "hidden", opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 30}px)`, position: "relative" }}>
          <div style={{ height: 40, background: "#f6f1e8", display: "flex", alignItems: "center", gap: 8, padding: "0 18px" }}>{[0, 1, 2].map((i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: "#ddd3c2" }} />)}<span style={{ marginLeft: 8, color: MUTED, fontSize: 15, fontWeight: 600 }}>Rapport · Sofie</span></div>
          <div style={{ padding: "26px 30px", textAlign: "left", fontSize: 24, lineHeight: 1.55, color: INK, minHeight: 200 }}>
            {tekst.slice(0, n)}<span style={{ opacity: n < tekst.length ? 1 : 0, color: GREEN }}>▏</span>
          </div>
          {klaar > 0.1 && <div style={{ position: "absolute", right: 22, bottom: 20, background: "#e7f4ed", color: GREEN2, fontWeight: 800, fontSize: 19, padding: "9px 16px", borderRadius: 999, transform: `scale(${Math.min(1, klaar)})` }}>✓ Klaar in seconden</div>}
        </div>
      </div>
    </Box>
  );
};

// 4 — Product in beweging: werkblad verschijnt (echt resultaat)
const WerkbladScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 16 } });
  const reveal = interpolate(frame, [15, 120], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const stamp = spring({ frame: frame - 120, fps, config: { damping: 11 } });
  return (
    <Box bg={CREAM} dur={180}>
      <div style={{ display: "flex", alignItems: "center", gap: 70 }}>
        <div style={{ maxWidth: 520, textAlign: "left" }}>
          <Rise delay={6}><div style={{ fontSize: 25, color: GREEN2, fontWeight: 700 }}>En dit rolt eruit</div></Rise>
          <Rise delay={14}><h2 style={{ fontFamily: SERIF, fontSize: 58, color: INK, margin: "12px 0 0", fontWeight: 600, lineHeight: 1.1 }}>Een compleet werkblad,<br />printklaar.</h2></Rise>
        </div>
        <div style={{ position: "relative", opacity: Math.min(1, s), transform: `translateY(${(1 - s) * 40}px) rotate(2deg)` }}>
          <div style={{ height: 780, overflow: "hidden", borderRadius: 16, boxShadow: "0 44px 100px rgba(34,28,58,.3)", clipPath: `inset(0 0 ${100 - reveal}% 0)` }}>
            <Img src={staticFile("resultaat.png")} style={{ height: 780, width: "auto", display: "block" }} />
          </div>
          <div style={{ position: "absolute", top: -22, right: -22, background: GREEN, color: "#fff", fontWeight: 800, fontSize: 21, padding: "11px 18px", borderRadius: 999, boxShadow: "0 14px 30px rgba(47,158,110,.4)", transform: `scale(${Math.min(1.05, stamp)}) rotate(6deg)` }}>✓ Printklaar</div>
        </div>
      </div>
    </Box>
  );
};

// 5 — Privacy als hét uitgangspunt
const Privacy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const schild = spring({ frame: frame - 55, fps, config: { damping: 13 } });
  const s = useIn(0, 16);
  return (
    <Box bg={INK} dur={210}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <Rise><div style={{ fontSize: 24, color: "#8fe3bd", fontWeight: 700, letterSpacing: 1 }}>ZORGEN OVER PRIVACY?</div></Rise>
        <Rise delay={10}><h1 style={{ fontFamily: SERIF, fontSize: 62, margin: "14px 0 40px", fontWeight: 600 }}>Dat is juist ons <span style={{ color: "#8fe3bd", fontStyle: "italic" }}>belangrijkste uitgangspunt</span>.</h1></Rise>
        <div style={{ position: "relative", display: "inline-block", opacity: Math.min(1, s) }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,.08)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 16, padding: "18px 26px", fontSize: 28 }}>
            <span style={{ color: "rgba(255,255,255,.6)" }}>Leerling:</span>
            <span style={{ fontWeight: 700, position: "relative" }}>
              <span style={{ opacity: 1 - Math.min(1, schild) }}>Sofie de Vries</span>
              <span style={{ position: "absolute", left: 0, top: 0, opacity: Math.min(1, schild), letterSpacing: 4 }}>••••• •• •••••</span>
            </span>
            <span style={{ fontSize: 30, transform: `scale(${Math.min(1.1, schild)})`, marginLeft: 6 }}>🔒</span>
          </div>
        </div>
        <Rise delay={70}><div style={{ fontSize: 27, marginTop: 30, color: "rgba(255,255,255,.9)" }}>De namen van je leerlingen gaan <b>nóóit</b> naar de AI. En jij houdt altijd <b>de regie</b>.</div></Rise>
      </div>
    </Box>
  );
};

// 6 — Alles afgevinkt: Gedaan
const Gedaan: React.FC = () => {
  return (
    <Box bg="#edf6f0" dur={150}>
      <div style={{ textAlign: "center" }}>
        <Rise><h1 style={{ fontFamily: SERIF, fontSize: 76, color: INK, margin: 0, fontWeight: 600 }}>Van <span style={{ color: MUTED, textDecoration: "line-through" }}>to-do</span> naar <span style={{ color: GREEN, fontStyle: "italic" }}>gedaan</span>.</h1></Rise>
        <Rise delay={16}><div style={{ fontSize: 30, color: GREEN2, marginTop: 20, fontWeight: 600 }}>Zo hou je tijd over. Voor je klas. En voor jezelf.</div></Rise>
        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 34, flexWrap: "wrap", maxWidth: 900 }}>
          {["Nakijken", "Rapporten", "Toetsanalyse", "Lessen"].map((t, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: "#fff", border: `1px solid ${SOFT}`, borderRadius: 999, padding: "11px 20px", fontWeight: 600, color: MUTED, fontSize: 22 }}>
              <span style={{ color: "#fff", background: GREEN, width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 15 }}>✓</span>
              {t}
            </div>
          ))}
        </div>
      </div>
    </Box>
  );
};

// 7 — Merk + CTA
const Merk: React.FC = () => {
  const s = useIn(4, 16);
  return (
    <Box bg={CREAM} dur={120}>
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: Math.min(1, s), transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})` }}>
          <Img src={staticFile("Avinka_logo_transparant.png")} style={{ width: 520, height: "auto" }} />
        </div>
        <Rise delay={26}><div style={{ marginTop: 22, display: "inline-block", background: GREEN, color: "#fff", fontWeight: 700, fontSize: 30, padding: "18px 44px", borderRadius: 16, boxShadow: "0 16px 34px rgba(47,158,110,.3)" }}>Ontdek Avinka</div></Rise>
      </div>
    </Box>
  );
};

export const Avinka: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: CREAM }}>
      <Sequence durationInFrames={240}><Overvol /></Sequence>
      <Sequence from={225} durationInFrames={150}><Intro /></Sequence>
      <Sequence from={360} durationInFrames={180}><RapportScene /></Sequence>
      <Sequence from={525} durationInFrames={180}><WerkbladScene /></Sequence>
      <Sequence from={690} durationInFrames={210}><Privacy /></Sequence>
      <Sequence from={885} durationInFrames={150}><Gedaan /></Sequence>
      <Sequence from={1020} durationInFrames={120}><Merk /></Sequence>
    </AbsoluteFill>
  );
};
