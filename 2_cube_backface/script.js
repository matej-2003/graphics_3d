const BACKGROUND = "black"
const FOREGROUND = "#00ff00"
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

function point({x, y}) {
	ctx.fillStyle = FOREGROUND;
	ctx.fillRect(x - s/2, y - s/2, s, s);
}


function screen(p) {
	// -1 .. 1 => 0 .. 1 => 0 .. w/h
	return {
		x: (p.x + 1) / 2 * game.width,
		y: (1 - (p.y + 1) / 2) * game.height
	}
}

function project({x, y, z}) {
	return {
		x: x/z,
		y: y/z,
	}
}

const vs = [
	{x: 0.25, y: 0.25, z: 0.25},
	{x: -0.25, y: 0.25, z: 0.25},
	{x: -0.25, y: -0.25, z: 0.25},
	{x: 0.25, y: -0.25, z: 0.25},


	{x: 0.25, y: 0.25, z: -0.25},
	{x: -0.25, y: 0.25, z: -0.25},
	{x: -0.25, y: -0.25, z: -0.25},
	{x: 0.25, y: -0.25, z: -0.25},
];

const fs = [
	[0, 1, 2, 3],
	[4, 5, 6, 7],
	[0, 1, 5, 4],
	[1, 2, 6, 5],
	[2, 3, 7, 6],
	[3, 0, 4, 7],
]

function translate_z({x, y, z}, dz) {
	return {x, y, z: z+dz}
}

function rotate_xz({x, y, z}, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return {
		x: x*c-z*s,
		y,
		z: x*s+z*c,
	}
}


function line(p1, p2) {
	// ctx.lineWidth = 2;
	ctx.strokeStyle = FOREGROUND;
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



const FPS = 30;
let dz = 1;
let angle = 0;

function frame() {
	const dt = 1/FPS;
	// dz += 1 * dt;
	clear()
	angle += Math.PI*dt;

	for (const f of fs) {
		for (let i=0; i<f.length; i++) {
			const a = vs[f[i]];
			const b = vs[f[(i + 1) % f.length]];

			line(
				screen(project(translate_z(rotate_xz(a, angle), dz))),
				screen(project(translate_z(rotate_xz(b, angle), dz)))
			)
		}

		// fillFace(f, (x) => screen(project(translate_z(rotate_xz(x, angle), dz))));
	}
}

setInterval(frame, 1000/FPS);
