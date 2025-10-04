import express, { Request, Response } from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

// Ruta principal
app.get("/", (req: Request, res: Response) => {
  res.send("🚀 Hola desde mi API REST con TypeScript en Replit! prueba de cambio");
});

// Ejemplo: saludo dinámico
app.get("/saludo/:nombre", (req: Request, res: Response) => {
  const nombre = req.params.nombre;
  res.json({ mensaje: `Hola, ${nombre}!` });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
