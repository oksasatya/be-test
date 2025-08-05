import { Router } from "express";
import * as UserController from "$controllers/rest/UserController";

const UserRoutes = Router({ mergeParams: true });

UserRoutes.post("/register", UserController.register);
UserRoutes.post("/login", UserController.login);

export default UserRoutes;