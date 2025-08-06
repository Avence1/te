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

  private currentAnimationName: string | null = null;
  private currentFrameIndex = 0;
  private frameDuration: number;
  private lastFrameTime = 0;
  private accumulator = 0;
  private abortController: AbortController;

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
    console.log(`动画 '${name}' 加载了 ${images.length} 帧。`);
  }

  public setAnimation(name: string): void {
    if (!this.animations.has(name)) {
      console.error(`错误：找不到名为 '${name}' 的动画。`);
      return;
    }
    if (this.currentAnimationName !== name) {
      this.currentAnimationName = name;
      this.currentFrameIndex = 0;
      this.lastFrameTime = 0;
      this.accumulator = 0;
    }
  }

  private loop = (currentTime: number): void => {
    if (!this.isRunning) return;

    if (this.lastFrameTime === 0) {
      this.lastFrameTime = currentTime;
    }
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    this.accumulator += deltaTime;

    while (this.accumulator >= this.frameDuration) {
      const currentAnimation = this.animations.get(this.currentAnimationName);
      if (currentAnimation) {
        this.currentFrameIndex =
          (this.currentFrameIndex + 1) % currentAnimation.length;
      }
      this.accumulator -= this.frameDuration;
    }

    this.draw();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private draw(): void {
    if (!this.currentAnimationName) return;
    const currentAnimation = this.animations.get(this.currentAnimationName);
    if (!currentAnimation || currentAnimation.length === 0) return;

    const image = currentAnimation[this.currentFrameIndex];

    const scaleX = this.width / image.width;
    const scaleY = this.height / image.height;
    const scaleFactor = Math.min(scaleX, scaleY);

    const newWidth = image.width * scaleFactor;
    const newHeight = image.height * scaleFactor;

    const x = (this.width - newWidth) / 2;
    const y = (this.height - newHeight) / 2;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.drawImage(image, x, y, newWidth, newHeight);
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
