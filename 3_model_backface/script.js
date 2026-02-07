const BACKGROUND = "black";
const FOREGROUND = "orange";
const s = 10;

game.width = 800;
game.height = 800;
const ctx = game.getContext("2d");

// --- Variables for Model Data ---
let model_vs = []; // Vertices
let model_fs = []; // Faces
let model_colors = [];

// --- Math & Transformation Functions (from script.js) ---
function screen(p) {
	return {
		x: (p.x + 1) / 2 * game.width,
		y: (1 - (p.y + 1) / 2) * game.height
	};
}

function project({ x, y, z }) {
	return { x: x / z, y: y / z };
}

function translate_z(v, dz) { return { ...v, z: v.z + dz }; }

function rotate_xz({ x, y, z }, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return { x: x * c - z * s, y, z: x * s + z * c };
}

function rotate_zy({ x, y, z }, angle) {
	const c = Math.cos(angle);
	const s = Math.sin(angle);
	return { x, y: y * c - z * s, z: y * s + z * c };
}

// --- Vector Math for Back-Face Culling ---
function vec_diff(v1, v2) {
	return { x: v1.x - v2.x, y: v1.y - v2.y, z: v1.z - v2.z };
}

function dot_product(a, b) {
	return (a.x * b.x) + (a.y * b.y) + (a.z * b.z);
}

function cross_product(a, b) {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	};
}

function normalize(v) {
	let d = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
	return { x: v.x / d, y: v.y / d, z: v.z / d };
}

function is_front_face(face_vs, sight_vec) {
	const [p1, p2, p3] = face_vs;
	const e12 = vec_diff(p2, p1);
	const e13 = vec_diff(p3, p1);
	const N = normalize(cross_product(e13, e12));
	// If dot product > 0, face is pointing away from camera (back-facing)
	return dot_product(sight_vec, N) <= 0;
}

// --- Drawing Functions ---
function clear() {
	ctx.fillStyle = BACKGROUND;
	ctx.fillRect(0, 0, game.width, game.height);
}

function line(p1, p2, color = FOREGROUND) {
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(p1.x, p1.y);
	ctx.lineTo(p2.x, p2.y);
	ctx.stroke();
}

function fillFace(face_indices, proj_func, color) {
	ctx.fillStyle = color;
	ctx.beginPath();
	const first_v = proj_func(model_vs[face_indices[0]]);
	ctx.moveTo(first_v.x, first_v.y);
	for (let i = 1; i < face_indices.length; i++) {
		const v = proj_func(model_vs[face_indices[i]]);
		ctx.lineTo(v.x, v.y);
	}
	ctx.closePath();
	ctx.fill();
}

// --- Model Loading (from script copy.js) ---
async function load_model(filename) {
	let vertices = [];
	let faces = [];
	let file = await fetch(filename);
	let file_text = await file.text();
	let file_lines = file_text.split("\n");

	for (let line of file_lines) {
		let tokens = line.trim().split(/\s+/);
		if (tokens[0] === "v") {
			vertices.push({
				x: parseFloat(tokens[1]),
				y: parseFloat(tokens[2]),
				z: parseFloat(tokens[3]),
			});
		} else if (tokens[0] === "f") {
			// Extract vertex index, handling "v/vt/vn" format
			let face = tokens.slice(1).map(t => parseInt(t.split("/")[0]) - 1);
			faces.push(face);
		}
	}
	return [vertices, faces];
}

function random_color() {
	const r = Math.floor(Math.random() * 255);
	const g = Math.floor(Math.random() * 255);
	const b = Math.floor(Math.random() * 255);
	return `rgb(${r}, ${g}, ${b})`;
}




let dz = 10;
let angle_y = 0;
let angle_x = -Math.PI/2;
const sight_vec = { x: 0, y: 0, z: 1 };
const FPS = 30;

const dt = 1 / FPS;
const rotation_speed = 0.09;


// --- Core Logic ---
function frame() {
	clear();

	// Define transformation pipeline
	// 1. Rotate 2. Translate in Z 3. Project to 2D 4. Map to screen
	let transform_3d = (v) => translate_z(rotate_zy(rotate_xz(v, angle_y), angle_x), dz);
	let project_to_screen = (v) => screen(project(transform_3d(v)));

	for (let i = 0; i < model_fs.length; i++) {
		const face = model_fs[i];

		// Get the 3D transformed positions of the vertices for this face
		const face_vs_3d = face.map(idx => transform_3d(model_vs[idx]));

		// Back-face culling check
		if (is_front_face(face_vs_3d, sight_vec)) {
			// Draw filled face
			fillFace(face, project_to_screen, model_colors[i]);

			// Draw wireframe/outline
			for (let j = 0; j < face.length; j++) {
				const p1 = project_to_screen(model_vs[face[j]]);
				const p2 = project_to_screen(model_vs[face[(j + 1) % face.length]]);
				line(p1, p2, "rgba(0,0,0,0.3)"); // Subtle wireframe
			}
		}
	}
}

// --- Input Handling ---
window.onwheel = (event) => {
	dz += event.deltaY * -0.005;
	dz = Math.min(Math.max(0.01, dz), 400);
};

document.addEventListener("mousemove", (event) => {
	const relativeX = event.clientX - game.offsetLeft;
	const relativeY = event.clientY - game.offsetTop;
	angle_y = Math.PI * (relativeX / game.width);
	angle_x = Math.PI * (relativeY / game.height);
});

async function main() {
	// Load the model specified in script copy.js
	// [model_vs, model_fs] = await load_model("/models/teapot.obj");
	[model_vs, model_fs] = await load_model("/models/cup.obj");
	// [model_vs, model_fs] = await load_model("/models/plate.obj");
	// [model_vs, model_fs] = await load_model("/models/bowl.obj");

	// Generate random colors for each face
	for (let i = 0; i < model_fs.length; i++) {
		// model_colors.push(random_color());
		model_colors.push(FOREGROUND);
	}

	setInterval(frame, 1000 / FPS);
}

main();