import axios from 'axios';
import asyncHandler from 'express-async-handler';

const breastCancer = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const imageUrl = req.file.path;

  // Call the breast cancer prediction API
  const response = await axios.post(
    'https://breast-model-api.onrender.com/predict',
    {
      image_url: imageUrl,
    }
  );
  res.status(200).json({
    status: 'success',
    data: response.data,
  });
});

const brainCancer = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // Get the Cloudinary URL from the uploaded file
  const imageUrl = req.file.path;

  // Call the brain tumor prediction API
  const response = await axios.post(
    'https://brain-cancer-api-efdfd2c65bbe.herokuapp.com/predict',
    {
      image_url: imageUrl,
    }
  );

  res.status(200).json({
    status: 'success',
    data: response.data,
  });
});

const skinCancer = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  // Get the Cloudinary URL from the uploaded file
  const imageUrl = req.file.path;

  // Call the skin cancer prediction API
  const response = await axios.post(
    'https://skin-cancer-api-fc3b6db8b2c2.herokuapp.com/api/predict',
    {
      url: imageUrl,
    }
  );

  res.status(200).json({
    status: 'success',
    data: response.data,
  });
});

const geneClassify = asyncHandler(async (req, res) => {
  const { gene, variation, text } = req.body;

  // Validate required fields
  if (!gene || !variation || !text) {
    return res.status(400).json({
      status: 'error',
      message:
        'Missing required fields: gene, variation, and text are required',
    });
  }

  // Call the gene classification API
  const response = await axios.post(
    'https://gene-classify-api-557a7e2b2275.herokuapp.com/predict',
    {
      gene,
      variation,
      text,
    }
  );

  res.status(200).json({
    status: 'success',
    data: response.data,
  });
});

export { breastCancer, brainCancer, skinCancer, geneClassify };
