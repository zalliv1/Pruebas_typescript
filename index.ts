import express from "express";
import { Router, Request, Response } from "express";
import { addBusinessTime } from "./utils/businessDays.ts";
import { DateTime } from "luxon";

const app = express();
const PORT = process.env.PORT || 3000;

// Ruta principal (opcional)
app.get("/", (req, res) => {
  res.send("🚀 API en funcionamiento. Usa /calculate para probar.");
});

// Ruta de cálculo
app.get("/calculate", async (req: Request, res: Response) => {

  try {
    const { days, hours, date } = req.query;

    const result = await addBusinessTime({
      days: days ? parseInt(days as string, 10) : undefined,
      hours: hours ? parseInt(hours as string, 10) : undefined,
      date: date ? (date as string) : undefined,
    });

    return res.json(result);
  } catch (error: any) {
    return res.status(400).json({
      error: "InvalidParameters",
      message: error.message,
    });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

export default app;
