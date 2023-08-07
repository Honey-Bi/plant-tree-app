import { BaseSyntheticEvent, useCallback, useEffect, useRef, useState } from "react";
import './App.css';


class Branches {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color = '#000';
  lineWidth:number;
  constructor(
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number,
    lineWidth: number
  ) {
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
    this.color = '#000000';
    this.lineWidth = lineWidth;
  }
  draw(ctx:CanvasRenderingContext2D) {
    ctx.beginPath();

    ctx.moveTo(this.startX, this.startY); // 선의 시작 위치 지정
    ctx.lineTo(this.endX, this.endY); // 선의 끝 위치 지정

    if (this.lineWidth < 3) {
      ctx.lineWidth = 0.5;
    } else if (this.lineWidth < 7) {
      ctx.lineWidth = this.lineWidth * 0.7;
    } else if (this.lineWidth < 10) {
      ctx.lineWidth = this.lineWidth * 0.9;
    } else {
      ctx.lineWidth = this.lineWidth;
    }
    
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.color;

    ctx.stroke();
    ctx.closePath();
  }
}

class Tree {
  position: {x:number; y:number};
  branches:Array<Branches> = [];
  ctx: CanvasRenderingContext2D;
  depth = 11;
  animation:any = null; 
  constructor(
    x:number, y:number,
    ctx: CanvasRenderingContext2D
  ){
    this.position = {x: x, y: y};
    this.branches = [];
    this.ctx = ctx;
    this.init();
  }
  init() {
    this.createBranch(this.position.x, this.position.y , -90, 0);
    this.draw(this.ctx);
  }

  createBranch(startX:number , startY:number, angle:number, depth:number) {
    if (depth === this.depth) return;

    const len = depth === 0 ? this.random(10, 13) : this.random(0, 11);

    const endX = startX + this.cos(angle) * len * (this.depth - depth);
    const endY = startY + this.sin(angle) * len * (this.depth - depth);

    this.branches.push(
      new Branches(startX, startY, endX, endY, this.depth - depth)
    );

    this.createBranch(endX, endY, angle - this.random(15, 23), depth + 1);
    this.createBranch(endX, endY, angle + this.random(15, 23), depth + 1);
  }

  draw(ctx:CanvasRenderingContext2D) {
    for (let i = 0; i < this.branches.length; i++) {
      this.branches[i].draw(ctx);
    }
  }

  cos(angle:number) {
    return Math.cos(this.degToRad(angle));
  }
  sin(angle:number) {
    return Math.sin(this.degToRad(angle));
  }
  degToRad(angle:number) {
    return (angle / 180.0) * Math.PI;
  }
  
  // random 함수 추가
  random(min:number, max:number) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}

const trees:Array<Tree> = [];

export default function App() {


  interface Size {width:number, height:number};
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
  const [size, setSize] = useState<Size>({width:0, height:0});

  const handleResize = useCallback(() => { // 화면 resize 크기 저장
    setSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
    
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;
      ctx?.clearRect(0, 0, size.width, size.height);
      trees.length = 0;
    }
  }, [ctx, size.height, size.width]);

  useEffect(() => { //context 처리
    if (canvasRef.current) {
      const canvas:HTMLCanvasElement = canvasRef.current;
      const context = canvas.getContext('2d') as CanvasRenderingContext2D;
      handleResize();
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      setCtx(context);
      trees.push(new Tree(window.innerWidth/2, window.innerHeight, context));
      console.log(trees);
    }
  }, [canvasRef, handleResize]);

  const handleClick = (e:BaseSyntheticEvent) => { // 화면 click 이벤트
    let pageX;
    if (ctx === null) {
      return;
    }
    if (e.type === "touchstart") {
      const event = e.nativeEvent as TouchEvent;
      pageX = event.changedTouches[0].pageX;
      trees.push(new Tree(pageX, window.innerHeight, ctx));
    } else if (e.type === "click") {
      const event = e.nativeEvent as MouseEvent;
      pageX = event.pageX;
      trees.push(new Tree(pageX, window.innerHeight, ctx));
    }
  }
  
  useEffect(() => { // 화면 resize 처리
    window.addEventListener('resize', handleResize);
    return () => {
        window.removeEventListener('resize', handleResize);
    }
  }, [handleResize, size]);

  return (
    <canvas 
      ref={canvasRef}
      onClick={handleClick}
      onTouchStart={handleClick}
    >
    </canvas>
  );
}
