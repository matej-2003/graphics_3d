const BACKGROUND = "black"
const FOREGROUND = "#00ff00"
const s = 2;

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
		x: x,
		y: z * s + y * c,
		z: z * c - y * s,
	}
}

function translate_y({ x, y, z }, dy) {
	return { x, y: y + dy, z }
}

function line(p1, p2) {
	// ctx.lineWidth = 2;
	ctx.strokeStyle = "red";
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.stroke();
}


function fillFace(vs_index, proj) {
	ctx.fillStyle = FOREGROUND;
	ctx.beginPath();
	let first = proj(teapot_vs[vs_index[0]]);
	ctx.moveTo(first.x, first.y);

	for (let i=1; i< vs_index.length; i++) {
		const v = proj(teapot_vs[vs_index[i]]);
		ctx.lineTo(v.x, v.y);
	}

	ctx.closePath();
	ctx.fill();
}

// function random_color() {
// 	return `rgb(${}, ${}, ${})`;
// }


const FPS = 30;
const rotation_speed = 0.09;
let dz = 5;
let angle = 0;
let teapot_vs = [];

let vertex_index = 10;

for (const [x, y, z] of tepot_vertices) {
	teapot_vs.push(translate_y(rotate_zy({ x: x, y: y, z: z }, Math.PI / 2), -3))
}

function frame() {
	const dt = 1 / FPS;
	// dz += 1 * dt;
	clear()
	angle += Math.PI * dt * rotation_speed;

	// for (let j = 0; j < teapot_vs.length; j++) {
	// 	let v = teapot_vs[j];
	// 	point(screen(project(translate_z(rotate_xz(v, angle), dz))))
	// }

	for (let j = 0; j < teapot_faces.length; j++) {
		let f = teapot_faces[j];
		for (let i = 0; i < f.length; i++) {
			const a = teapot_vs[f[i] - 1];
			const b = teapot_vs[f[(i + 1) % f.length] - 1];

			line(
				screen(project(translate_z(rotate_xz(a, angle), dz))),
				screen(project(translate_z(rotate_xz(b, angle), dz)))
			)
		}

		// fillFace(f, (x) => screen(project(translate_z(rotate_xz(x, angle), dz))));
	}
}


setInterval(frame, 1000/FPS);
