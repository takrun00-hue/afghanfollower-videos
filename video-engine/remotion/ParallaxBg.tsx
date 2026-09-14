import React from 'react';
import {AbsoluteFill, Img, interpolate, Easing, useCurrentFrame} from 'remotion';
export const ParallaxBg = ({src, duration}: {src: string; duration: number}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0,duration-1], [0,1], {easing: Easing.inOut(Easing.sin), extrapolateRight:'clamp'});
  return <AbsoluteFill style={{overflow:'hidden'}}><Img src={src} style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1.08+p*0.08}) translateX(${-p*24}px)`}}/></AbsoluteFill>;
};
