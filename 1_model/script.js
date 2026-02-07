const BACKGROUND = "black"
const FOREGROUND = "#00ff00"
const s = 2;

console.log(game);

game.width = 800;
game.height = 800;

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


async function load_model(filename) {
	let vertices = [];
	let faces = [];

	let file = await fetch(filename);
	let file_text = await file.text();
	file_lines = file_text.split("\n");


	for (let line of file_lines) {
		line_tokens = line.split(" ");
		if (line_tokens[0] == "v") {
			let vertex = {
				x: parseFloat(line_tokens[1]),
				y: parseFloat(line_tokens[2]),
				z: parseFloat(line_tokens[3]),
			};
			vertices.push(vertex);
			// console.log(vertex)

		} else if (line_tokens[0] == "f") {
			let face = [
				parseFloat(line_tokens[1].split("/")[0]) - 1,
				parseFloat(line_tokens[2].split("/")[0]) - 1,
				parseFloat(line_tokens[3].split("/")[0]) - 1,
			];
			faces.push(face);
		}
	}

	return [vertices, faces];
}

function getRandomInt(max) {
	return Math.floor(Math.random() * max);
}


function random_color() {
	return `rgb(${getRandomInt(255)}, ${getRandomInt(255)}, ${getRandomInt(255)})`;
}


function fillFace(face, proj, color) {
	ctx.fillStyle = color;
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
const rotation_speed = 0.09;
let dz = 10;
let scale = 1;

let angle = 0;
var teapot_vertices, teapot_faces;
let colors = [];
let teapot_vs = [];
let vertex_index = 10;


async function start() {
	// [teapot_vertices, teapot_faces] = await load_model("/models/Zeppelin_LZ_127.obj");
	[teapot_vertices, teapot_faces] = await load_model("/models/teapot.obj");
	console.log(teapot_vertices, teapot_faces);


	for (let i = 0; i < teapot_vertices.length; i++) {
		teapot_vs.push(translate_y(rotate_zy(teapot_vertices[i], Math.PI / 2), -3))
	}

	for (let j = 0; j < teapot_faces.length; j++) {
		colors.push(random_color());
	}
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
		let face = teapot_faces[j];
		for (let i = 0; i < face.length; i++) {
			const a = teapot_vs[face[i]];
			const b = teapot_vs[face[(i + 1) % face.length]];

			line(
				screen(project(translate_z(rotate_xz(a, angle), dz))),
				screen(project(translate_z(rotate_xz(b, angle), dz)))
			)
		}

		fillFace(face, (x) => screen(project(translate_z(rotate_xz(x, angle), dz))), colors[j]);
	}
}

async function main() {
	await start();
	setInterval(frame, 1000 / FPS);
};

onwheel = (event) => {
	dz += event.deltaY * -0.005;
	dz = Math.min(Math.max(0.001, dz), 100);
}
main();
