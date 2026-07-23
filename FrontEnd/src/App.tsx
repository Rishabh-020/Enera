import { useEffect } from "react";
import api from "./api/api";

function App() {

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get("/hello");
        console.log(response.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, []);

  return <h1 className="bg-cyan-300">React + Spring Boot</h1>;
}

export default App;