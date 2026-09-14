import React from 'react';
import {spring, useCurrentFrame, useVideoConfig} from 'remotion';
export const PopCard = ({icon = '✦'}: {icon?: string}) => {
  const frame = useCurrentFrame(); const {fps} = useVideoConfig();
  const p = spring({frame, fps, config: {damping: 13, stiffness: 130}});
  return <div aria-label="animated learning cue" style={{transform: `translateY(${(1-p)*45}px) scale(${0.8+p*0.2})`, opacity: Math.min(1,p), width:150,height:150,display:'grid',placeItems:'center',borderRadius:999,background:'rgba(255,255,255,.94)',color:'#16283f',fontSize:78,boxShadow:'0 20px 50px rgba(0,0,0,.24)'}}>{icon}</div>;
};
