import { Router, Request, Response } from "express";
import { addBusinessTime } from "./utils/businessDays.ts";

export const router = Router();

router.get("/calculate", async (req: Request, res: Response) => {
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
