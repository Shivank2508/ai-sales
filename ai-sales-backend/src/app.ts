import express from "express";
import cors from "cors"
import "dotenv/config"
import { leadRouter } from "./modules/leads/lead.routes";
import { productRouter } from "./modules/products/product.routes";
import { knowledgeRouter } from "./modules/knowledge/knowledge.routes";
import { documentRouter } from "./modules/documents/document.routes";

const app = express();
app.use(express.json());

app.use(cors())

app.use(
    `/leads`,
    leadRouter
);

app.use(
    `/products`,
    productRouter
);
app.use(
    `/knowledge`,
    knowledgeRouter
);
app.use(
  `/documents`,
  documentRouter
);

app.get("/health", (req, res) => {
    try {
        res.json({
            message: "ok"
        })
    } catch (err) {
        res.status(400).json({
            message: "not ok"
        })
        console.log(err)
    }

})
export default app



