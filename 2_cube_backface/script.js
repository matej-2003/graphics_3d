const BACKGROUND = "black"
const FOREGROUND = "orange"
const s = 10;

console.log(game);

game.width = 500;
game.height = 500;

const ctx = game.getContext("2d");
console.log(ctx);


function clear() {
	ctx.fillStyle = BACKGROUND;
	ctx.fillRect(0, 0, game.width, game.height);
}

function point({ x, y }) {
	ctx.fillStyle = FOREGROUND;
	ctx.fillRect(x - s / 2, y - s / 2, s, s);
}

function screen(p) {
	// -1 .. 1 => 0 .. 1 => 0 .. w/h
	return {
		x: (p.x + 1) / 2 * game.width,
		y: (1 - (p.y + 1) / 2) * game.height
	}
}

function project({ x, y, z }) {
	return {
		x: x / z,
		y: y / z,
	}
}

function translate_z({ x, y, z }, dz) {
	return { x, y, z: z + dz }
}

function translate_y({ x, y, z }, dy) {
	return { x, y: y + dy, z}
}

function translate_x({ x, y, z }, dx) {
	return { x: x + dx, y, z}
}

function rotate_xz({ x, y, z }, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return {
		x: x * c - z * s,
		y,
		z: x * s + z * c,
	}
}

function rotate_zy({ x, y, z }, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return {
		x,
		y: y * c - z * s,
		z: y * s + z * c,
	}
}

function line(p1, p2, color=FOREGROUND) {
	// ctx.lineWidth = 2;
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.stroke();
}

function fillFace(face, proj) {
	ctx.fillStyle = FOREGROUND;
	ctx.beginPath();

	const a_proj = proj(teapot_vs[face[0]]);
	ctx.moveTo(a_proj.x, a_proj.y);
	for (let i = 1; i < face.length; i++) {
		const v = proj(teapot_vs[face[i]]);
		ctx.lineTo(v.x, v.y);
	}
	ctx.closePath();
	ctx.fill();
}

function vec_diff(v1, v2) {
	return {
		x: v1.x - v2.x,
		y: v1.y - v2.y,
		z: v1.z - v2.z,
	}
}

function dot_product(a, b) {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross_product(a, b) {
	// cx = aybz − azby
	// cy = azbx − axbz
	// cz = axby − aybx
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	}
}


function dist(v) {
	return Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
}

function normalize(v) {
	let d = dist(v);
	return {
		x: x / d,
		y: y / d,
		z: z / d,
	}
}


function intersect_triangle(v) {
	const e12 = vec_diff(p2, p1);
	const e13 = vec_diff(p3, p1);

	const N = normalize(cross_product(e13, e12));
    // Implementing the single/double-sided feature
    if (dot_product(dir, N) > 0) {
		return false; // The surface is back-facing
	}
    return true;
}

const vs = [
	{ x: 0.25, y: 0.25, z: 0.25 },		// 0
	{ x: -0.25, y: 0.25, z: 0.25 },		// 1
	{ x: -0.25, y: -0.25, z: 0.25 },	// 2
	{ x: 0.25, y: -0.25, z: 0.25 },		// 3

	{ x: 0.25, y: 0.25, z: -0.25 },		// 4
	{ x: -0.25, y: 0.25, z: -0.25 },	// 5
	{ x: -0.25, y: -0.25, z: -0.25 },	// 6
	{ x: 0.25, y: -0.25, z: -0.25 },	// 7
];

const fs = [
	[0, 1, 2],
	[2, 3, 0],
	[4, 5, 6],
	[6, 7, 4],

	// [0, 3, 4, 7]
	[0, 4, 3],
	[4, 7, 3],

	// [0, 4, 5, 1]
	[0, 4, 5],
	[5, 1, 0],

	// [1, 5, 6, 2]
	[1, 5, 6],
	[6, 2, 1],

	// [2, 6, 7, 3]
	[2, 6, 7],
	[7, 3, 2],
]

function text(text, v, color=FOREGROUND, font="20px serif") {
	ctx.font = font;
	ctx.fillStyle = color;
	ctx.fillText(text, v.x, v.y);
}

function draw_axis(proj) {
	line(proj({x: -100, y: 0, z: 0}), proj({x: 100, y: 0, z: 0}), color="blue");	// x
	text("x", proj({x: -0.9, y: 0, z: 0}), color="blue");
	line(proj({x: 0, y: 100, z: 0}), proj({x: 0, y: -100, z: 0}), color="red");		// y
	text("y", proj({x: 0, y: 0.9, z: 0}), color="red");
	line(proj({x: 0, y: 0, z: 100}), proj({x: 0, y: 0, z: -100}), color="green");	// z
	text("z", proj({x: 0, y: 0, z: 1}), color="green");
}

const FPS = 30;
let dz = 1;
let angle_y = 0;
let angle_x = 0;

function frame() {
	const dt = 1 / FPS;
	clear()
	// angle_y += Math.PI * dt * 0.01;
	
	let proj = (x) => screen(project(translate_z(rotate_zy(rotate_xz(x, angle_y), angle_x), dz)));
	// let proj = (x) => screen(project(translate_z(x, dz)));
	
	draw_axis((x) => screen(project(translate_z(x, dz))));
	
	for (let i = 0; i < vs.length; i++) {
		text(`${i}`, proj(vs[i]));
		// point(proj(v));
	}

	for (const f of fs) {
		for (let i = 0; i < f.length; i++) {
			const a_proj = proj(vs[f[i]]);
			const b_proj = proj(vs[f[(i + 1) % f.length]]);

			line(a_proj, b_proj);
		}

		// fillFace(f, proj, dz));
	}
}



onwheel = (event) => {
	dz += event.deltaY * -0.005;
	dz = Math.min(Math.max(0.001, dz), 100);
}

function mouseMoveHandler(event) {
	const relativeX = event.clientX - game.offsetLeft;
	const relativeY = event.clientY - game.offsetTop;

	if (relativeX > 0 && relativeX < game.width) {
		angle_y = Math.PI * (relativeX / game.width);
	}

	if (relativeY > 0 && relativeY < game.height) {
		angle_x = Math.PI * (relativeY / game.height);
	}
};

document.addEventListener("mousemove", mouseMoveHandler);



setInterval(frame, 1000 / FPS);
