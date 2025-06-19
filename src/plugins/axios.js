import axios from 'axios';

function getUrl() {
    if (process.env.NODE_ENV === "development") {
        return "http://127.0.0.1:8000/api/"
    } else {
        return "/api/"
    }
}

const instance = axios.create({
    baseURL: getUrl(),
    timeout: 1000
  });

export default instance;
