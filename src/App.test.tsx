import React from "react";
import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "./App";

afterEach(() => vi.restoreAllMocks());

test("renders the tree canvas and draws another tree on click", () => {
  const context = {
    beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), closePath: vi.fn(), clearRect: vi.fn(),
    fillStyle: "", strokeStyle: "", lineWidth: 0,
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
  const frames: FrameRequestCallback[] = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => { frames.push(callback); return frames.length; });
  vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  const { container, unmount } = render(<App />);
  const canvas = container.querySelector("canvas")!;
  expect(canvas).not.toBeNull();
  expect(canvas.width).toBe(window.innerWidth);
  expect(canvas.height).toBe(window.innerHeight);
  act(() => frames.shift()!(0));
  expect(context.stroke).toHaveBeenCalled();
  const previousDraws = context.stroke.mock.calls.length;
  fireEvent.click(canvas, { clientX: 100 });
  act(() => { const scheduled = frames.splice(0); scheduled.forEach(callback => callback(16)); });
  expect(context.stroke.mock.calls.length).toBeGreaterThan(previousDraws);
  unmount();
});
