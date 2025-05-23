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
        zIndex: -10, // Push it behind everything else
        pointerEvents: 'none', // Don't block clicks
        overflow: 'hidden',
      }}
    >
      <DotLottieReact
        src="https://lottie.host/371ff15b-d38c-4ee2-8dfd-9237628ceaa7/C1z3gmIRYH.lottie"
        loop
        autoplay
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
}
