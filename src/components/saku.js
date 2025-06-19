export default {
    host: 'http://192.168.239.104:8080/',
    wsHost:'ws://192.168.239.104:8080/',
    async p(url, body = {}) {
        return fetch(this.host + url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        }).then((response) => {
            if (response.ok !== true) throw new Error();
            return response.text();
        })
    },
    s(url) {
        return new WebSocket(this.wsHost+url);
    }
}