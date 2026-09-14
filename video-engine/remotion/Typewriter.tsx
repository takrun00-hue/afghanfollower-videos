import React from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
export const Typewriter = ({text}: {text: string}) => {
  const frame = useCurrentFrame();
  const letters = Array.from(text);
  return <><span>{letters.slice(0, Math.floor(frame / 3) + 1).join('')}</span>
    {letters.map((_, i) => <Sequence key={i} from={i * 3} durationInFrames={2} layout="none">
      <Audio src={staticFile('typing.wav')} volume={0.25}/>
    </Sequence>)}</>;
};
