import { FC, useRef, useEffect } from "react";

import { PetAnimator } from "../../core/petAnimator";

import {
  DATA_WIDTH,
  DISPLAY_WIDTH,
  DISPLAY_HEIGHT,
  SCALE_FACTOR,
} from "../../const";

const idleImagePaths = import.meta.glob(
  [
    "/0000_core/pet/vup/Default/Happy/1/*.png",
    "/0000_core/pet/vup/Default/Happy/2/*.png",
    "/0000_core/pet/vup/Default/Happy/3/*.png",
  ],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const touchHeadImagePaths = import.meta.glob(
  [
    "/0000_core/pet/vup/Touch_Head/Happy/A/*.png",
    "/0000_core/pet/vup/Touch_Head/Happy/B/*.png",
    "/0000_core/pet/vup/Touch_Head/Happy/C/*.png",
  ],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const touchBodyImagePaths1 = import.meta.glob(
  [
    "/0000_core/pet/vup/Touch_Body/A_Happy/tb1/*.png",
    "/0000_core/pet/vup/Touch_Body/B_Happy/tb1/*.png",
    "/0000_core/pet/vup/Touch_Body/C_Happy/tb1/*.png",
  ],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const touchBodyImagePaths2 = import.meta.glob(
  [
    "/0000_core/pet/vup/Touch_Body/A_Happy/tb2/*.png",
    "/0000_core/pet/vup/Touch_Body/B_Happy/tb2/*.png",
    "/0000_core/pet/vup/Touch_Body/C_Happy/tb2/*.png",
  ],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const PetView: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animatorRef = useRef<PetAnimator | null>(null);

  const setupAnimation = async () => {
    try {
      await animatorRef.current.loadAnimation({
        name: "idle",
        path: idleImagePaths,
      });

      // const temp = await window.ContentAPI.getImgList("/0000_core/pet/vup");

      // console.log(temp, "==temp==");

      animatorRef.current.setAnimation({ name: "idle" });
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

    // Object.assign(canvas.style, {
    //   top: "20px",
    //   left: "200px",
    //   position: "relative",
    // });

    const animator = new PetAnimator({
      context,
      width: DATA_WIDTH,
      height: DATA_WIDTH,
      canvas,
    });
    animatorRef.current = animator;

    setupAnimation();
    return () => {
      animator.stop();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={DATA_WIDTH}
      height={DATA_WIDTH}
      style={{
        transform: `scale(${SCALE_FACTOR}) translate(-${
          ((DATA_WIDTH - DISPLAY_WIDTH) / 2 / DISPLAY_WIDTH) * 100
        }%,-${((DATA_WIDTH - DISPLAY_HEIGHT) / 2 / DISPLAY_HEIGHT) * 100}%)`,
      }}
    />
  );
};

export default PetView;
