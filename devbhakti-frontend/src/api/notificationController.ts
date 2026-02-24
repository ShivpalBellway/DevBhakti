import axios from "axios";
import { API_URL as BASE_API_URL } from "@/config/apiConfig";

const API_URL = `${BASE_API_URL}/notifications`;

export const fetchNotifications = async (userId: string, userType: string, page = 1, limit = 20) => {
  try {
    const response = await axios.get(API_URL, {
      params: { userId, userType, page, limit }
    });
    return response.data;
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return { success: false, data: [], unreadCount: 0 };
  }
};

export const markNotificationRead = async (id: string) => {
  try {
    const response = await axios.patch(`${API_URL}/${id}/read`);
    return response.data;
  } catch (error) {
    console.error("Mark read error:", error);
    return { success: false };
  }
};

export const markAllNotificationsRead = async (userId: string, userType: string) => {
  try {
    const response = await axios.patch(`${API_URL}/mark-all-read`, { userId, userType });
    return response.data;
  } catch (error) {
    console.error("Mark all read error:", error);
    return { success: false };
  }
};
