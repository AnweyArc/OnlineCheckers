// components/BackgroundLottie.js
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function BackgroundLottie() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        backgroundImage: 'url("https://i.redd.it/9uicpqcferw61.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  );
}
