const https = require('https')

class Request {

    // para que quando uma requisição disparar o erro tem que chamar o reject e acabar com o request
    errorTimeout = (reject, urlRequest) => () => reject(new Error(`timeout at [${urlRequest}] :(`))

    // timeout terminou chama o reject e estora o erro -> Quero colocar uma requisição concorrente
    raceTimeoutDelay(url, timeout) {
        return new Promise((resolve, reject) => {
            setTimeout(this.errorTimeout(reject, url), timeout)
        })
    }
    // bate na url e retorna JSON
    async get(url) {
        return new Promise((resolve, reject) => {
            // ele retorna um objeto que é o response que é uma string, é um evento do node
            https.get(url, res => {
                const items = []
                res
                    // armazena os pedacos da string
                    .on('data', data => items.push(data))
                    // concatena toda a requisição que veio
                    .on("end", () => resolve(JSON.parse(items.join(""))))
            })
            //se der algum erro na requisição 
                .on("error", reject)
        })
    }
    // Chamar a partir do metodo as requisições
    async makeRequest({ url, method, timeout }) {
        // vai na pagina e tenta baixar se demorar mais que o tempo limite retorna o erro e corta a coneccao
        return Promise.race([
            this[method](url),
            this.raceTimeoutDelay(url, timeout)
        ])
    }

}

module.exports = Request