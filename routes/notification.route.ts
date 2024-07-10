import express from "express";
import {
  getNotifications,
  updateAllNotificationsStatus,
  updateNotificationsStatus,
} from "../controllers/notification.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const notificationRouter = express.Router();

notificationRouter.get(
  "/notification",
  isAuthenticated,
  authorizeRoles("admin"),
  getNotifications
);

notificationRouter.put(
  "/read-notification/:id",
  isAuthenticated,
  authorizeRoles("admin"),
  updateNotificationsStatus
);

notificationRouter.put(
  "/read-all-notification",
  isAuthenticated,
  authorizeRoles("admin"),
  updateAllNotificationsStatus
);

export default notificationRouter;
