import { useEffect } from "react";
import axios from "axios";


export default function MyUsage() {
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3000/customers/myusage", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
          }
        });

        console.log(res.data);

      } catch (err) {
        console.log(err.response);
      }
    };

    fetchData();
  }, []);

  return <div>My Usage</div>;
}