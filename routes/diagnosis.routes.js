import express from 'express';
import axios from 'axios';
import createUploader from '../middlewares/cloudnairyMiddleware.js';
import {
  brainCancer,
  breastCancer,
  geneClassify,
  skinCancer,
} from '../controllers/diagnosis.controller.js';

const diagnosisRouter = express.Router();
const upload = createUploader('diagnosis-images');

// Breast Cancer Prediction Endpoint
diagnosisRouter.post('/breast-cancer', upload.single('image'), breastCancer);

// Brain Tumor Prediction Endpoint
diagnosisRouter.post('/brain-tumor', upload.single('image'), brainCancer);

// Gene Classification Endpoint
diagnosisRouter.post('/gene-classify', geneClassify);

// Skin Cancer Prediction Endpoint
diagnosisRouter.post('/skin-cancer', upload.single('image'), skinCancer);

export default diagnosisRouter;
