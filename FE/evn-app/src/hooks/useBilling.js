import { useState} from "react";
import { getInvoicesAPI, createPaymentAPI } from "../services/billingService";

export const useBilling = () => {

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // const [success, setSuccess] = useState(null);
  
    const getInvoices = async (customer_id) => {
        try {
            setLoading(true);
            setError(null);

            const res = await getInvoicesAPI(customer_id);

            setInvoices(res.data.invoices);

            return res.data;
        } catch (err) {
            const message = err.response?.data?.message || "Lỗi lấy hóa đơn";
            setError(message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createPayment = async (invoice_id) => {
        try {
            setLoading(true);
            setError(null);

            const res = await createPaymentAPI(invoice_id);

            return res.data;

        } catch (err) {
            const message =
            err.response?.data?.message || "Lỗi tạo thanh toán";

            setError(message);
            throw err;

        } finally {
            setLoading(false);
        }
    };
    
    return {
        loading,
        error,
        getInvoices,
        invoices,
        createPayment,
    };
};