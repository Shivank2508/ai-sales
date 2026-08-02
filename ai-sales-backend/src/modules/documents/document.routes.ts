import { Router } from "express";
import { documentUpload } from "../../config/upload.js";

import {
  uploadDocumentSchema,
} from "./document.schema.js";

import {
  uploadDocument,
} from "./document.controller.js";

export const documentRouter =
  Router();

documentRouter.post(
  "/",documentUpload.single("file"),uploadDocument
);