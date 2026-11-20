const { ok, fail } = require("./response");

module.exports = (Model) => {
  return {
    getAll: async (req, res, next) => {
      try {
        const records = await Model.findAll();
        return ok(res, "Records fetched successfully", records);
      } catch (error) {
        next(error);
      }
    },

    getOne: async (req, res, next) => {
      try {
        const record = await Model.findByPk(req.params.id);
        if (!record) return fail(res, "Record not found", 404);
        return ok(res, "Record fetched successfully", record);
      } catch (error) {
        next(error);
      }
    },

    create: async (req, res, next) => {
      try {
        const record = await Model.create(req.body);
        return ok(res, "Record created successfully", record, 201);
      } catch (error) {
        next(error);
      }
    },

    update: async (req, res, next) => {
      try {
        const record = await Model.findByPk(req.params.id);
        if (!record) return fail(res, "Record not found", 404);
        await record.update(req.body);
        return ok(res, "Record updated successfully", record);
      } catch (error) {
        next(error);
      }
    },

    remove: async (req, res, next) => {
      try {
        const record = await Model.findByPk(req.params.id);
        if (!record) return fail(res, "Record not found", 404);
        await record.destroy();
        return ok(res, "Record deleted successfully", null);
      } catch (error) {
        next(error);
      }
    }
  };
};