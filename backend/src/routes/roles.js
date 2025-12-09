import { Router } from "express";
const router = Router();
router.get("/", (req, res) => res.json(["Top", "Jungle", "Middle", "Bottom", "Support"]));
export default router;
