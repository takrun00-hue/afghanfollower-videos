import React from 'react';
import {AbsoluteFill, Audio, Composition, registerRoot, Sequence, staticFile} from 'remotion';
import {Typewriter} from './Typewriter';
import {PopCard} from './PopCard';
import {ParallaxBg} from './ParallaxBg';
const words = [['Hallo','👋'],['Danke','♥'],['Bitte','✋'],['Guten Morgen','☀'],['Auf Wiedersehen','↗']];
const Preview = () => <AbsoluteFill>
  <style>{`@font-face{font-family:Vazirmatn;src:url('${staticFile('fonts/Vazirmatn-Regular.woff2')}')}`}</style>
  {words.map(([word,icon],i)=><Sequence key={word} from={i*120} durationInFrames={120}>
    <ParallaxBg src={staticFile('preview-background.svg')} duration={120}/>
    <Audio src={staticFile(`preview-narration/de-${i}.mp3`)} volume={1}/>
    <Sequence from={25} layout="none"><Audio src={staticFile(`preview-narration/fa-${i}.mp3`)} volume={1}/></Sequence>
    <AbsoluteFill style={{justifyContent:'center',alignItems:'center',gap:70,padding:80}}>
      <div style={{fontFamily:'Arial',fontSize:word.length>12?76:96,fontWeight:800,color:'white',textAlign:'center'}}><Typewriter text={word}/></div>
      <Sequence from={40} layout="none"><PopCard icon={icon}/></Sequence>
    </AbsoluteFill>
  </Sequence>)}
</AbsoluteFill>;
registerRoot(()=> <Composition id="Preview" component={Preview} durationInFrames={600} fps={30} width={1080} height={1920}/>);
