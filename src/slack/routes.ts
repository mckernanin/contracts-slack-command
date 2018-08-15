import * as express from "express";
import * as errors from "../utils/error";
import * as controller from "./controller";

const router = express.Router();

router.get("/setup", errors.catchErrors(controller.setup));
router.get("/command", errors.catchErrors(controller.command));
router.post("/command", errors.catchErrors(controller.command));

export default router;
