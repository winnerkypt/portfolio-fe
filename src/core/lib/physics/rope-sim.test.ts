import { describe, expect, it, vi } from "vitest";
import { MAX_REACH, ROPE_POINTS, createRopeSim } from "./rope-sim";

const offsets = { clip: 0.05, card: 1.2 };

function settle(sim: ReturnType<typeof createRopeSim>, seconds: number): void {
  for (let t = 0; t < seconds; t += 1 / 60) sim.advance(1 / 60, t);
}

describe("createRopeSim", () => {
  it("hangs below the anchor and settles", () => {
    const sim = createRopeSim(true);
    sim.setAnchor([0, 2, 0]);

    settle(sim, 3);

    expect(sim.tip()[1]).toBeLessThan(2);
    expect(Math.abs(sim.tip()[0])).toBeLessThan(0.05);
  });

  it("only resets the rope on the first anchor", () => {
    const sim = createRopeSim(true);
    sim.setAnchor([0, 2, 0]);
    sim.grab();
    sim.drag([0.3, 1.8, 0]);
    sim.setAnchor([0.1, 2, 0]);

    expect(sim.tip()[0]).toBeCloseTo(0.3, 5);
  });

  it("clamps drags to the reachable length", () => {
    const sim = createRopeSim(true);
    sim.setAnchor([0, 2, 0]);
    sim.grab();

    sim.drag([5, 2, 0]);

    expect(Math.hypot(sim.tip()[0], sim.tip()[1] - 2)).toBeCloseTo(MAX_REACH, 5);
  });

  it("holds the tip while grabbed and lets go on release", () => {
    const sim = createRopeSim(true);
    sim.setAnchor([0, 2, 0]);
    sim.grab();
    sim.drag([0.3, 1.7, 0]);
    settle(sim, 0.5);
    expect(sim.tip()[0]).toBeCloseTo(0.3, 5);

    sim.release(false);
    settle(sim, 0.5);

    expect(sim.tip()[0]).not.toBeCloseTo(0.3, 2);
  });

  it("flips on tap and reports each flip state", () => {
    const onFlip = vi.fn();
    const sim = createRopeSim(true, onFlip);
    sim.setAnchor([0, 2, 0]);

    sim.grab();
    sim.release(true);
    sim.grab();
    sim.release(true);
    sim.grab();
    sim.release(false);

    expect(onFlip.mock.calls).toEqual([[true], [false]]);
  });

  it("spins toward the flip target", () => {
    const sim = createRopeSim(true);
    sim.setAnchor([0, 2, 0]);
    sim.grab();
    sim.release(true);

    settle(sim, 4);

    expect(sim.spinAngle()).toBeCloseTo(Math.PI, 1);
  });

  it("exposes a pose hanging from the tip", () => {
    const sim = createRopeSim(true);
    sim.setAnchor([0, 2, 0]);
    settle(sim, 2);

    const pose = sim.pose(offsets);

    expect(pose.card[1]).toBeLessThan(sim.tip()[1]);
    expect(sim.buffers.count).toBe(ROPE_POINTS);
  });

  describe("applyScrollImpulse", () => {
    function hanging(): ReturnType<typeof createRopeSim> {
      const sim = createRopeSim(false);
      sim.setAnchor([0, 2, 0]);
      settle(sim, 4);
      return sim;
    }

    function fling(sim: ReturnType<typeof createRopeSim>, velocity: number, frames: number): number {
      let peak = 0;
      for (let i = 0; i < frames; i++) {
        sim.applyScrollImpulse(velocity);
        sim.advance(1 / 60, 10 + i / 60);
        peak = Math.max(peak, Math.abs(sim.tip()[0]));
      }
      return peak;
    }

    it("swings the card away from rest while scrolling", () => {
      const sim = hanging();
      const rest = Math.abs(sim.tip()[0]);

      const peak = fling(sim, 1500, 20);

      expect(peak).toBeGreaterThan(rest + 0.02);
    });

    it("swings the other way when scrolling up", () => {
      const down = hanging();
      const up = hanging();

      fling(down, 1500, 15);
      fling(up, -1500, 15);

      expect(Math.sign(down.tip()[0] - up.tip()[0])).not.toBe(0);
      expect(down.tip()[0] * up.tip()[0]).toBeLessThan(0);
    });

    it("kicks in proportion to the frame time so 120Hz and 60Hz feel alike", () => {
      const tipSpeed = (dt: number): number => {
        const sim = hanging();
        const last = (ROPE_POINTS - 1) * 3;
        const before = sim.buffers.positions[last] - sim.buffers.previous[last];
        sim.applyScrollImpulse(1500, dt);
        return Math.abs(sim.buffers.positions[last] - sim.buffers.previous[last] - before);
      };

      expect(tipSpeed(1 / 120)).toBeCloseTo(tipSpeed(1 / 60) / 2, 6);
      expect(tipSpeed(1)).toBeCloseTo(tipSpeed(1 / 60) * 2, 6);
    });

    it("ignores a non-positive frame time", () => {
      const sim = hanging();
      const before = sim.tip();

      sim.applyScrollImpulse(2000, 0);
      sim.advance(1 / 60, 30);

      expect(Math.abs(sim.tip()[0] - before[0])).toBeLessThan(0.01);
    });

    it("settles back near rest once the impulses stop", () => {
      const sim = hanging();
      const rest = sim.tip()[0];
      fling(sim, 2000, 20);

      for (let t = 0; t < 12; t += 1 / 60) sim.advance(1 / 60, 20 + t);

      expect(Math.abs(sim.tip()[0] - rest)).toBeLessThan(0.03);
    });

    it("clamps absurd flings so the card cannot be flung past the rope length", () => {
      const sim = hanging();

      const peak = fling(sim, 1_000_000, 90);

      expect(peak).toBeLessThanOrEqual(MAX_REACH);
      expect(Math.abs(sim.pose(offsets).angleZ)).toBeLessThan(Math.PI / 2);
    });

    it("keeps every rope coordinate finite under repeated extreme input", () => {
      const sim = hanging();

      fling(sim, Number.MAX_VALUE, 200);
      fling(sim, -Number.MAX_VALUE, 200);

      expect(Array.from(sim.buffers.positions).every(Number.isFinite)).toBe(true);
      expect(Number.isFinite(sim.spinAngle())).toBe(true);
    });

    it("ignores NaN and Infinity", () => {
      const sim = hanging();
      const before = sim.tip();

      sim.applyScrollImpulse(Number.NaN);
      sim.applyScrollImpulse(Number.POSITIVE_INFINITY);
      sim.advance(1 / 60, 30);

      expect(Array.from(sim.buffers.positions).every(Number.isFinite)).toBe(true);
      expect(Math.abs(sim.tip()[0] - before[0])).toBeLessThan(0.01);
    });

    it("does nothing under reduced motion", () => {
      const sim = createRopeSim(true);
      sim.setAnchor([0, 2, 0]);
      settle(sim, 3);
      const before = sim.tip();

      sim.applyScrollImpulse(2000);
      settle(sim, 0.5);

      expect(sim.tip()[0]).toBeCloseTo(before[0], 5);
    });

    it("does not disturb a card the user is holding", () => {
      const sim = createRopeSim(false);
      sim.setAnchor([0, 2, 0]);
      sim.grab();
      sim.drag([0.2, 1.7, 0]);

      sim.applyScrollImpulse(2000);
      settle(sim, 0.3);

      expect(sim.tip()[0]).toBeCloseTo(0.2, 5);
    });
  });
});
