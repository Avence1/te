type AnimationMap = Map<string, HTMLImageElement[]>;
interface PetAnimatorParams {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  frameDuration?: number;
}

class PetAnimator {
  private context: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private canvas: HTMLCanvasElement;
  private animations: AnimationMap = new Map();
  private isRunning = false;
  private animationFrameId = 0;
  private animationsQueen: HTMLImageElement[][] = [];
  private currentAnimation: HTMLImageElement[] = [];

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
    this.init(params);
  }

  private init(params: PetAnimatorParams): void {
    this.context = params.context;
    this.width = params.width;
    this.height = params.height;
    this.canvas = params.canvas;
    this.frameDuration = params.frameDuration ?? 120;
    this.context.imageSmoothingEnabled = true;
    this.context.imageSmoothingQuality = "high";
  }

  public async loadAnimation(
    name: string,
    imagePaths: Record<string, { default: string }>
  ): Promise<void> {
    const imagePromises = Object.values(imagePaths).map((path) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.src = path["default"];
        img.onload = () => resolve(img);
        img.onerror = reject;
      });
    });
    const images = await Promise.all(imagePromises);
    this.animations.set(name, images);

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

  public async loadAndSetAnimation(
    name: string,
    imagePaths: Record<string, { default: string }>
  ): Promise<void> {
    if (!this.animations.has(name)) {
      await this.loadAnimation(name, imagePaths);
    }
    this.setAnimation(name, true);
  }

  public setAnimation(name: string, applyNow?: boolean): void {
    if (!this.animations.has(name)) {
      console.error(`错误：找不到名为 '${name}' 的动画。`);
      return;
    }
    if (applyNow) {
      this.animationsQueen.shift();
      this.animationsQueen.unshift(this.animations.get(name));
      this.currentAnimation = this.animations.get(name);
      this.currentFrameIndex = 0;
      this.lastFrameTime = 0;
      this.accumulator = 0;
    } else {
      this.animationsQueen.push(this.animations.get(name));
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
    }

    if (this.animationsQueen.length === 0) {
      this.setAnimation("idle", true);
    }

    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.accumulator += deltaTime;

    if (
      this.currentAnimation.length === 0 ||
      this.currentFrameIndex === this.currentAnimation.length - 1
    ) {
      this.currentFrameIndex = 0;
      this.currentAnimation = this.animationsQueen.shift();
    }

    while (this.accumulator >= this.frameDuration) {
      if (this.currentAnimation.length !== 0) {
        this.currentFrameIndex =
          (this.currentFrameIndex + 1) % this.currentAnimation.length;
      }
      this.accumulator -= this.frameDuration;
    }
    this.draw();
    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private draw(): void {
    if (this.currentAnimation.length === 0) return;

    const image = this.currentAnimation[this.currentFrameIndex];

    const scaleX = this.width / image.width;
    const scaleY = this.height / image.height;
    const scaleFactor = Math.min(scaleX, scaleY);

    const newWidth = image.width * scaleFactor;
    const newHeight = image.height * scaleFactor;

    const x = (this.width - newWidth) / 2;
    const y = (this.height - newHeight) / 2;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.save();

    // const colorList = ["red", "green", "blue"];
    // const tempList = [...Object.values(this.boundary)];

    // tempList.reverse().forEach((b, i) => {
    //   this.context.fillStyle = colorList.at(i % colorList.length);
    //   this.context.fillRect(b.left, b.top, b.right - b.left, b.bottom - b.top);
    // });

    this.context.drawImage(image, x, y, newWidth, newHeight);

    this.context.fillStyle = "black";

    // this.context.beginPath();
    // this.context.arc(290, 128, 10, 0, 360);
    // this.context.fill();

    this.context.restore();
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
}

export { PetAnimator };
