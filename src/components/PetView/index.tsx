import { FC, useRef, useEffect } from "react";

import { PetAnimator } from "../../core/petAnimator";

interface IPetViewProps {
  width: number;
  height: number;
}

const idleImagePaths = import.meta.glob(
  ["/0000_core/pet/vup/Music/Single/Happy/*.png"],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const PetView: FC<IPetViewProps> = (props) => {
  const { width, height } = props;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animatorRef = useRef<PetAnimator | null>(null);

  const setupAnimation = async () => {
    try {
      await animatorRef.current.loadAnimation("idle", idleImagePaths);

      const temp = await window.ContentAPI.getImgList("/0000_core/pet/vup");

      console.log(temp, "==temp==");

      animatorRef.current.setAnimation("idle");
      animatorRef.current.start();
    } catch (error) {
      console.error("加载动画资源失败:", error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const animator = new PetAnimator({ context, width, height, canvas });
    animatorRef.current = animator;

    setupAnimation();

    setTimeout(() => {
      animator.stop();
    }, 10000);

    return () => {
      animator.stop();
    };
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} />;
};

export default PetView;
