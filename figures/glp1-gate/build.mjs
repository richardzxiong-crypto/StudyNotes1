// GLP-1 figure: a glucose-gated insulin valve on a bench.
// Built with the Anatomy skill kit (https://github.com/wheresryan22/anatomy, MIT).
// Run: ANATOMY=<path to skill> node build.mjs [--light]
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { homedir } from "node:os";

const KIT = process.env.ANATOMY ?? join(homedir(), ".claude/skills/anatomy");
const k = await import(pathToFileURL(join(KIT, "kit/iso-kit.mjs")).href);
const { kitScript } = await import(pathToFileURL(join(KIT, "scripts/inline-kit.mjs")).href);

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const WIDTH = 600;
const HEIGHT = 400;

// ---- model (schematic) ----
// Glucose moves a float carriage; the carriage's arm meets the plunger collar only above the
// threshold, so insulin is released only when glucose is high. GLP-1 doubles the gain.
const G_MIN = 50, G_MAX = 250, G_T = 90;      // mg/dL; GLP-1's insulin effect fades out near 70-90
const Z_PER_G = 0.25;                          // world units of carriage rise per mg/dL
const carriageZ = (g) => 20 + (g - G_MIN) * Z_PER_G;
const LIFT_MAX = carriageZ(G_MAX) - carriageZ(G_T);   // 40
const GAIN = { off: 1, on: 2 };
const FULL = LIFT_MAX * GAIN.on;               // needle travel at full scale = output 10
const DIAL_SPAN = 0.85;                        // full scale is 0.85 of a turn

// ---- world ----
const PLATE = { x: -122, y: -40, w: 210, d: 92, r: 8 };
const PLATE_H = 12, FOOT_H = 5;
const COL = { x: -100, y: -14, w: 30, d: 14, r: 1.5 };   // front face at y = 0
const COL_TOP = 100;
const CAR = { x: -100, y: 0, w: 20, d: 14, r: 1.2 };     // slides on the column's front face
const CAR_H = 12;
const AXIS = [40, 7];                                    // plunger axis
const ARM = { x: -80, y: 4, w: AXIS[0] + 7 - -80, d: 6, r: 1 };
const STAND = { x: 30, y: -18, w: 20, d: 12, r: 1.2 };  // front face y = -6
const STAND_TOP = 140;
const LEDGE = { x: 34, y: -6, w: 12, d: 8.6, r: 0.8 };
const REST = carriageZ(G_T) + CAR_H;                     // collar bottom at rest (42)
const COLLAR_R = 6, COLLAR_H = 6;
const ROD_R = 1.8;
const BLOCK = { x: 32, y: -6, w: 16, d: 22, r: 1.5 };
const BLOCK_Z = 92, BLOCK_H = 12, BLOCK_TOP = BLOCK_Z + BLOCK_H;
const STEM_Z = 114, STEM_R = 3.4;
const DIAL_Z = 150, DIAL_H = 9, DIAL_R = 22, DIAL_TOP = DIAL_Z + DIAL_H;
const ROD_TOP = 118;
const HOLD = { x: -64, y: 16, w: 28, d: 24, r: 2 };      // cartridge holder
const HOLD_H = 22;
const CART = [-50, 28];
const CART_R = 5.4, CART_H = 40, CART_IN = 3, CART_OUT = 30;

const P = k.fitProjection(
  [...k.boxCorners(PLATE, -PLATE_H - FOOT_H, 0), [AXIS[0] - DIAL_R, AXIS[1], DIAL_TOP], [AXIS[0] + DIAL_R, AXIS[1], DIAL_TOP], [AXIS[0], AXIS[1] - DIAL_R, DIAL_TOP], [CART[0], CART[1], CART_OUT + CART_H + 6], [COL.x, COL.y, COL_TOP + 4]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 40 },
);
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const byDepth = (pts) => [...pts].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));

function plate() {
  const out = [`<path class="iso-halo" d="${k.haloOf(PLATE, -PLATE_H - FOOT_H, PLATE_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(PLATE, 20))) {
    out.push(S(k.cylinder(x, y, 7, -PLATE_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -PLATE_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(PLATE, -PLATE_H, PLATE_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(PLATE, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge
  const strip = { x: -24, y: PLATE.y + PLATE.d - 14, w: 104, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate, back left
  const label = { x: 56, y: PLATE.y + 8, w: 26, d: 26, r: 1.2 };
  out.push(S(k.slabOf(label, 0, 0.8, P, 3, 0.3), { tone: "lo", crease: "none" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 4, label.y + 6.4], 0.8, P, "x"), "GLP-1 RA", { size: 3.4, tone: "mid" }));
  for (const [i, w] of [[0, 18], [1, 14], [2, 16], [3, 10]]) out.push(L(k.lineOnTop([label.x + 4, label.y + 10 + i * 3], [label.x + 4 + w, label.y + 10 + i * 3], 0.8, P), { tone: "faint", free: true }));
  out.push(D([at([label.x + 2, label.y + 2, 0.8]), at([label.x + label.w - 2, label.y + 2, 0.8]), at([label.x + 2, label.y + label.d - 2, 0.8]), at([label.x + label.w - 2, label.y + label.d - 2, 0.8])], { size: 0.4 }));
  return out.join("");
}

function column() {
  const out = [];
  const foot = k.insetPlan(COL, -4);
  out.push(S(k.slabOf(foot, 0, 6, P, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners(foot, 2.6).map(([x, y]) => at([x, y, 6])), { size: 0.45 }));
  out.push(S(k.slabOf(COL, 6, COL_TOP - 6, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(COL, -1.2), COL_TOP, 4, P, 3, 0.5), { tone: "mid" }));
  out.push(D([at([COL.x + 4, COL.y + 7, COL_TOP + 4]), at([COL.x + COL.w - 4, COL.y + 7, COL_TOP + 4])], { size: 0.45 }));
  // glucose scale: a strip on the front face with ticks rooted on its left edge
  const sx = COL.x + COL.w - 6;
  const z0 = carriageZ(G_MIN) + CAR_H / 2, z1 = carriageZ(G_MAX) + CAR_H / 2;
  out.push(S(k.slabOf({ x: sx, y: 0, w: 3, d: 1, r: 0.3 }, z0 - 3, z1 - z0 + 6, P, 2), { tone: "lo", crease: "none" }));
  const minor = [], major = [];
  for (let g = G_MIN; g <= G_MAX; g += 10) {
    const z = carriageZ(g) + CAR_H / 2;
    const len = g % 50 === 0 ? 3.8 : 2;
    (g % 50 === 0 ? major : minor).push(k.segment([sx, 0, z], [sx - len, 0, z], P));
  }
  out.push(L(minor.join(""), { tone: "lo" }), L(major.join(""), { tone: "mid" }));
  const zt = carriageZ(G_T) + CAR_H / 2;
  out.push(L(k.segment([sx, 0, zt], [sx - 3.8, 0, zt], P), { tone: "hi" }));
  return out.join("");
}

function stand() {
  const out = [];
  const foot = k.insetPlan(STAND, -4);
  out.push(S(k.slabOf(foot, 0, 5, P, 4, 0.6), { tone: "mid" }));
  out.push(D(k.corners(foot, 2.4).map(([x, y]) => at([x, y, 5])), { size: 0.45 }));
  out.push(S(k.slabOf(STAND, 5, STAND_TOP - 5, P, 3, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf(LEDGE, REST - 4, 4, P, 2, 0.4), { tone: "mid" }));
  out.push(D([at([LEDGE.x + 2.5, LEDGE.y + 1.5, REST]), at([LEDGE.x + LEDGE.w - 2.5, LEDGE.y + 1.5, REST])], { size: 0.4 }));
  out.push(S(k.slabOf({ x: 36, y: -6, w: 8, d: AXIS[1] - STEM_R + 6 + 0.4, r: 0.8 }, 128, 10, P, 2, 0.4), { tone: "mid" }));
  out.push(D([at([40, -4, 138])], { size: 0.4 }));
  return out.join("");
}

function carriage() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(CAR, 2), 0, 0.1, P)}" style="filter:blur(3px);opacity:.25"/>`];
  out.push(S(k.slabOf(CAR, 0, CAR_H, P, 3, 0.5), { tone: "hi", crease: "lo" }));
  out.push(D([at([CAR.x + 3, CAR.d - 3, CAR_H]), at([CAR.x + CAR.w - 3, CAR.d - 3, CAR_H]), at([CAR.x + 3, 3, CAR_H])], { size: 0.42, tone: "lo" }));
  // index pointer on the carriage's +x face, aimed at the scale
  out.push(S(k.slabOf({ x: CAR.x + CAR.w, y: 0.2, w: 2.6, d: 2, r: 0.3 }, CAR_H / 2 - 0.6, 1.2, P, 2), { tone: "hi", lit: true, crease: "none" }));
  out.push(S(k.slabOf(ARM, CAR_H - 4, 4, P, 2, 0.4), { tone: "hi", crease: "lo" }));
  out.push(D([at([ARM.x + 4, ARM.y + 3, CAR_H]), at([ARM.x + 14, ARM.y + 3, CAR_H])], { size: 0.4, tone: "lo" }));
  // push pad at the tip
  out.push(S(k.cylinder(AXIS[0], AXIS[1], 3.6, CAR_H, 0.8, P, 20), { tone: "hi" }));
  return out.join("");
}

function plungerUnder() {
  const out = [];
  out.push(S(k.cylinder(AXIS[0], AXIS[1], COLLAR_R, REST, COLLAR_H, P, 36, 0.5), { tone: "hi", lit: true }));
  out.push(L(k.knurl(AXIS[0], AXIS[1], COLLAR_R, REST + 1.2, REST + COLLAR_H - 1.2, 30, P), { tone: "lo" }));
  out.push(S(k.cylinder(AXIS[0], AXIS[1], ROD_R, REST + COLLAR_H, BLOCK_TOP + 2 - REST - COLLAR_H, P, 16), { tone: "hi", lit: true, crease: "none" }));
  return out.join("");
}

function block() {
  const out = [];
  out.push(S(k.slabOf(BLOCK, BLOCK_Z, BLOCK_H, P, 3, 0.5), { tone: "mid" }));
  out.push(L(k.ring(AXIS[0], AXIS[1], ROD_R + 1.4, BLOCK_TOP, P, 20), { tone: "lo" }));
  out.push(D(k.corners(BLOCK, 2.6).map(([x, y]) => at([x, y, BLOCK_TOP])), { size: 0.42 }));
  return out.join("");
}

function rodOver() {
  return S(k.cylinder(AXIS[0], AXIS[1], ROD_R, BLOCK_TOP - LIFT_MAX - 1, ROD_TOP - BLOCK_TOP + LIFT_MAX + 1, P, 16), { tone: "hi", lit: true, crease: "none" });
}

function dial() {
  const out = [];
  const [x, y] = AXIS;
  out.push(S(k.cylinder(x, y, STEM_R, STEM_Z, DIAL_Z - STEM_Z, P, 20), { tone: "mid", crease: "none" }));
  out.push(L(k.sideArc(x, y, STEM_R, 124, P, 12) + k.sideArc(x, y, STEM_R, 142, P, 12), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, DIAL_R, DIAL_Z, DIAL_H, P, 72, 0.8), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(x, y, DIAL_R, DIAL_TOP - 3.4, DIAL_TOP, 90, P, 0.3), { tone: "lo" }));
  out.push(L(k.sideArc(x, y, DIAL_R, DIAL_TOP - 3.4, P, 48), { tone: "faint" }));
  out.push(L(k.ring(x, y, DIAL_R - 2.2, DIAL_TOP, P, 72), { tone: "lo" }));
  const span = DIAL_SPAN * Math.PI * 2;
  const ticks = k.radialTicks(x, y, DIAL_R - 2.2, 50, 5, DIAL_TOP, [1.3, 2.8], P, 0, span * 50 / 50 + span / 50 * 0.001);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  // numerals 0 / 5 / 10 inside the ring
  for (const [v, t] of [[0, "0"], [5, "5"], [10, "10"]]) {
    const a = (v / 10) * span, r = DIAL_R - 8;
    out.push(k.faceTextSvg(k.topMatrix([x + Math.sin(a) * r, y - Math.cos(a) * r + 1], DIAL_TOP, P, "x"), t, { size: 2.6, tone: "mid", anchor: "middle" }));
  }
  out.push(k.faceTextSvg(k.topMatrix([x, y + 9], DIAL_TOP, P, "x"), "INSULIN", { size: 2.2, tone: "lo", anchor: "middle" }));
  // crown on the +x side
  out.push(S(k.slabOf({ x: x + DIAL_R - 1, y: y - 2.4, w: 5, d: 4.8, r: 1.2 }, DIAL_Z + 2, 5, P, 3), { tone: "mid" }));
  out.push(S(k.slabOf({ x: x + DIAL_R + 3.6, y: y - 3.2, w: 2.6, d: 6.4, r: 1.2 }, DIAL_Z + 1.2, 6.6, P, 3), { tone: "mid" }));
  out.push(L(k.ring(x, y, 1.6, DIAL_TOP, P, 16), { tone: "mid" }));
  return out.join("");
}

function holderBack() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(HOLD, 0, HOLD_H, P)}" style="opacity:.5"/>`);
  out.push(S(k.slabOf(HOLD, 0, 3, P, 4, 0.5), { tone: "mid" }));
  out.push(S(k.slabOf({ x: HOLD.x, y: HOLD.y, w: HOLD.w, d: 3, r: 0.6 }, 3, HOLD_H - 3, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf({ x: HOLD.x, y: HOLD.y + 3, w: 3, d: HOLD.d - 3, r: 0.6 }, 3, HOLD_H - 3, P, 2, 0.4), { tone: "mid" }));
  out.push(L(k.ring(CART[0], CART[1], CART_R + 1.2, 3, P, 28), { tone: "lo" }));
  return out.join("");
}

function cartridge() {
  const out = [];
  const [x, y] = CART;
  out.push(S(k.cylinder(x, y, CART_R, 0, CART_H, P, 32), { tone: "hi", crease: "none" }));
  out.push(L(k.sideArc(x, y, CART_R, 8, P, 20) + k.sideArc(x, y, CART_R, 28, P, 20), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, CART_R + 0.6, CART_H, 6, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.knurl(x, y, CART_R + 0.6, CART_H + 0.8, CART_H + 5.2, 28, P), { tone: "lo" }));
  out.push(L(k.ring(x, y, 2, CART_H + 6, P, 16), { tone: "lo" }));
  out.push(D([at([x, y, CART_H + 6])], { size: 0.5, tone: "hi" }));
  return out.join("");
}

function holderFront() {
  const out = [];
  const front = { x: HOLD.x + 3, y: HOLD.y + HOLD.d - 3, w: HOLD.w - 3, d: 3, r: 0.6 };
  const side = { x: HOLD.x + HOLD.w - 3, y: HOLD.y + 3, w: 3, d: HOLD.d - 6, r: 0.6 };
  out.push(S(k.slabOf(side, 3, HOLD_H - 3, P, 2, 0.4), { tone: "mid" }));
  out.push(S(k.slabOf(front, 3, HOLD_H - 3, P, 2, 0.4), { tone: "mid" }));
  out.push(k.faceTextSvg(k.sideMatrix([front.x + 5, front.y + front.d], 13, P, "left"), "GLP-1", { size: 4, tone: "mid" }));
  out.push(D([at([front.x + 2, front.y + 1.5, HOLD_H]), at([front.x + front.w - 2, front.y + 1.5, HOLD_H]), at([side.x + 1.5, side.y + 2, HOLD_H])], { size: 0.4 }));
  return out.join("");
}

const needleAt = (turn) => {
  const a = turn * Math.PI * 2, [x, y] = AXIS;
  return k.lineOnTop([x - Math.sin(a) * 3.4, y + Math.cos(a) * 3.4], [x + Math.sin(a) * (DIAL_R - 4), y - Math.cos(a) * (DIAL_R - 4)], DIAL_TOP + 0.2, P);
};

// rod above the guide block: clipped in screen space to the region above the bore
const bore = at([AXIS[0], AXIS[1], BLOCK_TOP]);
const clip = `<clipPath id="rod-over"><rect x="${bore[0] - 40}" y="-1000" width="80" height="${1000 + bore[1]}"/></clipPath>`;

const G0 = 140;
const lift0 = Math.max(0, carriageZ(G0) - carriageZ(G_T));
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "A bench rig. A carriage on a column rises with blood glucose. Its arm reaches under the weighted collar of an insulin plunger, but the collar rests on a ledge until glucose passes about 90 mg/dL, so below that the plunger does not move. Above it, the arm lifts the plunger and a dial reads insulin output. A GLP-1 cartridge dropped into its holder doubles how far the needle turns per millimetre of lift, but cannot move the needle while the collar sits on its ledge.",
  body: [
    `<defs>${clip}</defs>`,
    plate(),
    column(),
    stand(),
    `<g data-part="carriage" transform="${k.translateAlong(P, [0, 0, carriageZ(G0)])}">${carriage()}</g>`,
    holderBack(),
    `<g data-part="cart" transform="${k.translateAlong(P, [0, 0, CART_IN])}">${cartridge()}</g>`,
    holderFront(),
    `<g data-part="under" transform="${k.translateAlong(P, [0, 0, lift0])}">${plungerUnder()}</g>`,
    block(),
    `<g clip-path="url(#rod-over)"><g data-part="over" transform="${k.translateAlong(P, [0, 0, lift0])}">${rodOver()}</g></g>`,
    dial(),
    `<path data-part="needle" class="iso-line" data-tone="lit" data-free="" d="${needleAt(lift0 * GAIN.on / FULL * DIAL_SPAN)}" style="stroke-width:1.1"/>`,
  ],
});

const live = `
const P = ${JSON.stringify(P)};
const AXIS = ${JSON.stringify(AXIS)}, DIAL_R = ${DIAL_R}, DIAL_TOP = ${DIAL_TOP};
const G_MIN = ${G_MIN}, G_MAX = ${G_MAX}, G_T = ${G_T}, Z_PER_G = ${Z_PER_G}, FULL = ${FULL}, SPAN = ${DIAL_SPAN};
const CART_IN = ${CART_IN}, CART_OUT = ${CART_OUT};
const carriageZ = (g) => 20 + (g - G_MIN) * Z_PER_G;
const needleAt = ${needleAt.toString().replace("k.lineOnTop", "lineOnTop")};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const part = (name) => svg.querySelector('[data-part="' + name + '"]');
const car = part("carriage"), under = part("under"), over = part("over"), needle = part("needle"), cart = part("cart");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
let g = ${G0}, gTarget = g, drug = 1, drugTarget = 1, cz = ${CART_IN}, needleTurn = 0;
let frame = 0, last = 0, clock = 0, touring = !still.matches, visible = false, idle = 0;
const TOUR = 9;
function tourAt(t) {
  const phase = (t % TOUR) / TOUR;
  gTarget = 75 + 135 * Math.pow(Math.sin(Math.PI * phase), 2);
  drugTarget = Math.floor(t / TOUR) % 2 === 0 ? 1 : 0;
}
function draw() {
  const lift = Math.max(0, carriageZ(g) - carriageZ(G_T));
  car.setAttribute("transform", translateAlong(P, [0, 0, carriageZ(g)]));
  const up = translateAlong(P, [0, 0, lift]);
  under.setAttribute("transform", up);
  over.setAttribute("transform", up);
  cart.setAttribute("transform", translateAlong(P, [0, 0, cz]));
  const gain = 1 + drug;
  const out = lift * gain / FULL * 10;
  needle.setAttribute("d", needleAt(lift * gain / FULL * SPAN));
  const text = Math.round(g) + " mg/dL · GLP-1 " + (drugTarget ? "on" : "off") + " · insulin " + out.toFixed(1);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(g)));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring) { clock += dt; tourAt(clock); }
  const ease = (v, t, s) => (calm ? t : v + (t - v) * (1 - Math.exp(-dt / s)));
  g = ease(g, gTarget, 0.35);
  cz = ease(cz, drugTarget ? CART_IN : CART_OUT, 0.3);
  // the gear engages only once the cartridge is seated, and takes up over a quarter second
  drug = ease(drug, drugTarget && cz - CART_IN < 1 ? 1 : 0, 0.25);
  if (Math.abs(drug - Math.round(drug)) < 0.002) drug = Math.round(drug);
  if (Math.abs(gTarget - g) < 0.05) g = gTarget;
  draw();
  const settled = !touring && g === gTarget && Math.abs(cz - (drugTarget ? CART_IN : CART_OUT)) < 0.01 && (drug === 0 || drug === 1);
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const hold = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; clock = 0; run(); }, 5000); run(); };
new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
stage.addEventListener("pointermove", (event) => {
  const box = svg.getBoundingClientRect();
  const share = clamp(((event.clientX - box.left) / box.width - 0.2) / 0.6, 0, 1);
  gTarget = G_MIN + share * (G_MAX - G_MIN); hold();
});
stage.addEventListener("click", () => { drugTarget = drugTarget ? 0 : 1; hold(); });
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp" || event.key === "ArrowRight") gTarget = clamp(Math.round(gTarget / 10) * 10 + 10, G_MIN, G_MAX);
  else if (event.key === "ArrowDown" || event.key === "ArrowLeft") gTarget = clamp(Math.round(gTarget / 10) * 10 - 10, G_MIN, G_MAX);
  else if (event.key === " " || event.key === "Enter") drugTarget = drugTarget ? 0 : 1;
  else return;
  event.preventDefault(); hold();
});
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "GLP-1: insulin only when glucose is high",
  hint: "Hover: glucose · click: GLP-1",
  readout: "140 mg/dL · GLP-1 on · insulin " + (lift0 * GAIN.on / FULL * 10).toFixed(1),
  keys: [
    { mark: "lit", label: "Insulin plunger, collar and needle: what the pancreas releases" },
    { mark: "raised", label: "Glucose carriage and the GLP-1 cartridge" },
  ],
  caption:
    "A schematic rig, not a dose chart. The carriage rises with blood glucose, but the plunger's collar rests on a ledge until glucose passes about 90 mg/dL, so at normal or low glucose the arm cannot lift it. Above that, insulin rises with glucose. Seating the GLP-1 cartridge doubles how far the needle turns per millimetre of lift (the 2× is illustrative); it cannot turn the needle while the collar is on its ledge. That is why GLP-1 drugs on their own rarely cause low blood sugar.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Blood glucose: arrow keys change it, Space seats or lifts the GLP-1 cartridge" aria-valuemin="${G_MIN}" aria-valuemax="${G_MAX}" aria-valuenow="${G0}">${svg}</div>`,
});

const name = theme === "light" ? "glp1-gate-light.html" : "glp1-gate.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "GLP-1: insulin only when glucose is high", theme, body, script: kitScript() + live }));
console.log("wrote", name);
