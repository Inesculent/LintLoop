import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection error", err));

// Queries
/*import userQueries from "./queries/userQueries.js";
import submissionQueries from "./queries/submissionQueries.js";
import problemsQueries from "./queries/problemsQueries.js";

app.use("/users", userQueries);
app.use("/submissions", submissionQueries);
app.use("/problems", problemsQueries);*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

