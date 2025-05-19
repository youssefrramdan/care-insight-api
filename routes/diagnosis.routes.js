import express from 'express';
import axios from 'axios';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  brainCancer,
  breastCancer,
  geneClassify,
} from '../controllers/diagnosis.controller.js';

const diagnosisRouter = express.Router();
const upload = createUploader('diagnosis-images');

// Breast Cancer Prediction Endpoint
diagnosisRouter.post('/breast-cancer', upload.single('image'), breastCancer);

// Brain Tumor Prediction Endpoint
diagnosisRouter.post('/brain-tumor', upload.single('image'), brainCancer);

// Gene Classification Endpoint
diagnosisRouter.post('/gene-classify', geneClassify);

export default diagnosisRouter;
