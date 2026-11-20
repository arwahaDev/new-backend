const express = require("express");
const router = express.Router();

const Worker = require("../models/workerModel");
const { protect, authorize } = require("../middleware/authMiddleware");
const { ok, fail } = require("../utils/response");

// Get all workers
router.get("/", protect, async (req, res, next) => {
  try {
    const workers = await Worker.findAll();
    return ok(res, "Workers fetched successfully", workers);
  } catch (error) {
    next(error);
  }
});

// Get single worker
router.get("/:id", protect, async (req, res, next) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return fail(res, "Worker not found", 404);
    }

    return ok(res, "Worker fetched successfully", worker);
  } catch (error) {
    next(error);
  }
});

// Create worker
router.post("/", protect, async (req, res, next) => {
  try {
    const worker = await Worker.create(req.body);
    return ok(res, "Worker created successfully", worker, 201);
  } catch (error) {
    next(error);
  }
});

// Update worker - Admin only
router.put("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return fail(res, "Worker not found", 404);
    }

    await worker.update(req.body);
    return ok(res, "Worker updated successfully", worker);
  } catch (error) {
    next(error);
  }
});

// Delete worker - Admin only
router.delete("/:id", protect, authorize("admin"), async (req, res, next) => {
  try {
    const worker = await Worker.findByPk(req.params.id);

    if (!worker) {
      return fail(res, "Worker not found", 404);
    }

    await worker.destroy();
    return ok(res, "Worker deleted successfully", null);
  } catch (error) {
    next(error);
  }
});

module.exports = router;