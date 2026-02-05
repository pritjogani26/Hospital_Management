import { error } from "console";
import { toast } from "react-toastify";

const ToastService = {
  success: (message: string, opts: any = {}) =>
    toast.success(message, { autoClose: 4000, pauseOnHover: true, ...opts }),
  info: (message: string, opts: any = {}) =>
    toast.info(message, { autoClose: 4000, pauseOnHover: true, ...opts }),
  warn: (message: string, opts: any = {}) =>
    toast.warn(message, { autoClose: 5000, pauseOnHover: true, ...opts }),
  error: (message: string, opts: any = {}) =>
    toast.error(message, { autoClose: 5000, pauseOnHover: true, ...opts }),
  clear: () => toast.dismiss(),
};

export default ToastService;
