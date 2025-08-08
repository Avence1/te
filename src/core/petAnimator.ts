import { SCALE_FACTOR } from "../const";

type AnimationMap = Map<string, HTMLImageElement[]>;
interface PetAnimatorParams {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  frameDuration?: number;
}

interface AnimationSequence {
  frames: HTMLImageElement[];
  isLooping: boolean;
}

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

const riseImagePath = import.meta.glob(
  ["/0000_core/pet/vup/Raise/Raised_Dynamic/Happy/*.png"],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const riseLoopImagePath = import.meta.glob(
  [
    "/0000_core/pet/vup/Raise/Raised_Static/A_Happy/*.png",
    "/0000_core/pet/vup/Raise/Raised_Static/B_Happy/*.png",
  ],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

const downImagePath = import.meta.glob(
  ["/0000_core/pet/vup/Raise/Raised_Static/C_Happy/*.png"],
  {
    eager: true,
    query: "url",
  }
) as Record<string, { default: string }>;

class PetAnimator {
  private context: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private canvas: HTMLCanvasElement;
  private animations: AnimationMap = new Map();
  private risePoint?: Map<string, { x: number; y: number }> = new Map();
  private isRunning = false;
  private animationFrameId = 0;
  private animationsQueue: AnimationSequence[] = [];
  private currentAnimation?: AnimationSequence = void 0;
  private isDragAble?: boolean = false;
  private currentPos: { x: number; y: number } = { x: 0, y: 0 };
  private dragStartPos: { x: number; y: number } = { x: 0, y: 0 };

  private petStatus: "happy" | "ill" | "normal" | "poorCondition" = "normal";

  private currentFrameIndex = 0;
  private frameDuration: number;
  private lastFrameTime = 0;
  private accumulator = 0;
  private abortController: AbortController;
  private boundary: Record<
    "head" | "body" | "pinch",
    {
      top: number;
      bottom: number;
      right: number;
      left: number;
    }
  >;

  constructor(params: PetAnimatorParams) {
    this.context = params.context;
    this.width = params.width;
    this.height = params.height;
    this.canvas = params.canvas;
    this.frameDuration = params.frameDuration ?? 120;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";
  }

  public async loadAnimation(params: {
    name: string;
    path?: Record<string, { default: string }>;
  }): Promise<void> {
    const { name, path } = params;
    const imagePromises = Object.values(path ?? idleImagePaths).map((path) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = path["default"];
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    });
    const images = await Promise.all(imagePromises);
    this.animations.set(name, images);
    this.risePoint.set(name, { x: 290, y: 128 });

    //149, 128, 56, 59
    //159, 16, 189, 178
    //166, 206, 163, 136
    this.boundary = {
      pinch: {
        left: 149,
        top: 128,
        right: 149 + 56,
        bottom: 128 + 59,
      },
      head: {
        left: 159,
        top: 16,
        right: 159 + 189,
        bottom: 16 + 178,
      },
      body: {
        left: 166,
        top: 206,
        right: 166 + 163,
        bottom: 206 + 136,
      },
    };

    console.log(`动画 '${name}' 加载了 ${images.length} 帧。`);
  }

  public async setAnimation(params: {
    name: string;
    applyNow?: boolean;
    isLoop?: boolean;
    path?: Record<string, { default: string }>;
  }): Promise<void> {
    const { name, applyNow, isLoop, path } = params;

    if (!this.animations.has(name)) {
      if (path !== void 0) {
        console.log(`正在获取动画 '${name}' 中`);
        await this.loadAnimation({ name, path });
        console.log(`动画 '${name}' 加载完成`);
      } else {
        console.error(`错误：找不到名为 '${name}' 的动画。`);
        return;
      }
    }
    const temp: AnimationSequence = {
      frames: this.animations.get(name),
      isLooping: isLoop ?? false,
    };

    if (applyNow) {
      this.currentAnimation = temp;

      this.currentFrameIndex = 0;
      this.lastFrameTime = 0;
      this.accumulator = 0;
    } else {
      this.animationsQueue.push(temp);
    }
  }

  public checkBody(pos: {
    x: number;
    y: number;
  }): "head" | "body" | "pinch" | undefined {
    return Object.keys(this.boundary).find((k: "head" | "body" | "pinch") => {
      return this.hitTest(pos, this.boundary[k]);
    }) as "head" | "body" | "pinch";
  }

  public hitTest(
    pos: { x: number; y: number },
    boundary: { top: number; bottom: number; right: number; left: number }
  ): boolean {
    return (
      pos.x >= boundary.left &&
      pos.x <= boundary.right &&
      pos.y >= boundary.top &&
      pos.y <= boundary.bottom
    );
  }

  public start(): void {
    if (!this.abortController || this.abortController.signal.aborted) {
      this.abortController = new AbortController();
      this.canvas.addEventListener(
        "mouseenter",
        () => {
          window.ContentAPI.setIgnoreMouseEvent(false);
        },
        {
          signal: this.abortController.signal,
        }
      );
      this.canvas.addEventListener(
        "mouseleave",
        () => {
          window.ContentAPI.setIgnoreMouseEvent(true);
        },
        {
          signal: this.abortController.signal,
        }
      );

      let mousedownTimeout: ReturnType<typeof setTimeout>;

      this.canvas.addEventListener(
        "mousedown",
        (e) => {
          this.isDragAble = false;
          const t = this.checkBody({ x: e.offsetX, y: e.offsetY });

          if (t === "body") {
            mousedownTimeout = setTimeout(async () => {
              await this.setAnimation({
                name: "rise",
                applyNow: true,
                isLoop: true,
                path: { ...riseImagePath, ...riseLoopImagePath },
              });

              this.isDragAble = true;
              this.dragStartPos = { x: e.screenX, y: e.screenY };

              const tempPos = this.risePoint.get("rise");

              if (tempPos) {
                this.currentPos.x +=
                  (e.offsetX - (tempPos?.x ?? 0)) * SCALE_FACTOR;
                this.currentPos.y +=
                  (e.offsetY - (tempPos?.y ?? 0)) * SCALE_FACTOR;
                Object.assign(this.canvas.style, {
                  top: `${this.currentPos.y}px`,
                  left: `${this.currentPos.x}px`,
                  position: "relative",
                });
              }
            }, 500);
          } else {
            this.isDragAble = false;
          }
        },
        {
          signal: this.abortController.signal,
        }
      );
      window.addEventListener(
        "mousemove",
        (e) => {
          if (!this.isDragAble) return;

          const offsetX = e.screenX - this.dragStartPos.x;
          const offsetY = e.screenY - this.dragStartPos.y;

          const { x, y } = this.currentPos;

          Object.assign(this.canvas.style, {
            top: `${y + offsetY}px`,
            left: `${x + offsetX}px`,
            position: "relative",
          });
        },
        {
          signal: this.abortController.signal,
        }
      );
      this.canvas.addEventListener(
        "mouseup",
        (e) => {
          if (!this.isDragAble) {
            clearTimeout(mousedownTimeout);
            const t = this.checkBody({
              x: e.offsetX,
              y: e.offsetY,
            });
            const useNew = Math.random() > 0.5;
            switch (t) {
              case "pinch":
              case "head":
                this.setAnimation({
                  name: "touchHead",
                  applyNow: true,
                  path: touchHeadImagePaths,
                });
                break;
              case "body":
                this.setAnimation({
                  name: useNew ? "touchBody1" : "touchBody2",
                  applyNow: true,
                  path: useNew ? touchBodyImagePaths1 : touchBodyImagePaths2,
                });
                break;
            }
          } else {
            this.setAnimation({
              name: "down",
              applyNow: true,
              isLoop: false,
              path: downImagePath,
            });
            this.currentPos = {
              x: isNaN(parseInt(this.canvas.style.left))
                ? 0
                : parseInt(this.canvas.style.left),
              y: isNaN(parseInt(this.canvas.style.top))
                ? 0
                : parseInt(this.canvas.style.top),
            };
          }
          this.isDragAble = false;
        },
        {
          signal: this.abortController.signal,
        }
      );
    }

    if (this.isRunning) return;
    this.isRunning = true;
    this.animationFrameId = requestAnimationFrame(this.loop);
    console.log("动画已启动。");
  }

  public stop(): void {
    if (this.abortController && !this.abortController.signal.aborted) {
      this.abortController.abort();
      this.abortController = null;
      console.log("事件监听器已被移除。");
    }

    if (!this.isRunning) return;
    this.isRunning = false;
    cancelAnimationFrame(this.animationFrameId);
    console.log("动画已停止。");
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.accumulator += deltaTime;

    if (!this.currentAnimation) {
      this.setAnimation({
        name: "idle",
        applyNow: true,
        isLoop: true,
      });
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    const isAnimationFinished =
      this.currentFrameIndex >= this.currentAnimation.frames.length - 1;

    if (isAnimationFinished) {
      if (this.currentAnimation.isLooping) {
        // 循环动画：什么都不用做，下面的帧更新逻辑会自动把它绕回第0帧
      } else {
        // 单次动画：从队列中取出下一个，或者设置默认 idle
        this.currentAnimation = this.animationsQueue.shift();
        if (!this.currentAnimation) {
          this.setAnimation({ name: "idle", applyNow: true, isLoop: true });
        }
        // 重置新动画的帧索引
        this.currentFrameIndex = 0;
      }
    }

    while (this.accumulator >= this.frameDuration) {
      this.currentFrameIndex =
        (this.currentFrameIndex + 1) % this.currentAnimation.frames.length;
      this.accumulator -= this.frameDuration;
    }

    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private draw(): void {
    const image = this.currentAnimation?.frames?.[this.currentFrameIndex];

    if (this.currentAnimation?.frames?.length === 0 || !image) return;

    const scaleX = this.width / image.width;
    const scaleY = this.height / image.height;
    const scaleFactor = Math.min(scaleX, scaleY);

    const newWidth = image.width * scaleFactor;
    const newHeight = image.height * scaleFactor;

    const x = (this.width - newWidth) / 2;
    const y = (this.height - newHeight) / 2;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.save();

    this.context.drawImage(image, x, y, newWidth, newHeight);

    // this.context.fillStyle = "black";

    // this.context.beginPath();
    // this.context.arc(290, 128, 10, 0, 360);
    // this.context.fill();

    // this.context.restore();
  }
}

export { PetAnimator };
