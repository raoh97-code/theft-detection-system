import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";
import { startDetectionLoop } from "./anomalyDetector.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", apiRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Secure Counter Backend Running" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startDetectionLoop(); // start auto detection
});