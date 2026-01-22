"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventController_1 = require("../../controllers/admin/eventController");
const router = express_1.default.Router();
// Event routes
router.get('/', eventController_1.getAllEvents);
router.get('/temple/:templeId', eventController_1.getEventsByTemple);
router.post('/', eventController_1.createEvent);
router.put('/:id', eventController_1.updateEvent);
router.delete('/:id', eventController_1.deleteEvent);
exports.default = router;
