import { Composition } from "remotion";
import { Avinka } from "./Avinka";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Avinka"
      component={Avinka}
      durationInFrames={1140}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
