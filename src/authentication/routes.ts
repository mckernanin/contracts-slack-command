import * as express from "express";
import * as errors from "../utils/error";
import * as controller from "./controller";

const router = express.Router();

router.get("/login", errors.catchErrors(controller.login));
router.get("/oauth", errors.catchErrors(controller.callback));

export default router;
