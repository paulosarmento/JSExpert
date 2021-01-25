// Controla o fluxo das requisições 

const Request = require("./request")

const DEFAULT_OPTIONS = {
    // maximo de 4 tentativas
    maxRetries: 4,
    // quanto tempo devo esperar para tentar de novo
    retryTimeout: 1000,
    // quanto tempo maximo para ele retornar uma requisição
    maxRequestTimeout: 1000,
    // tempo de intervalo de uma requisição e outra 
    threshold: 200
}

class Pagination {
    constructor(options = DEFAULT_OPTIONS) {
        this.request = new Request()
        this.maxRetries = options.maxRetries
        this.retryTimeout = options.retryTimeout
        this.maxRequestTimeout = options.maxRequestTimeout
        this.threshold = options.threshold
    }
    // função recursiva utilizamos o reties para quando cair no catch e der o problema ele retornar o erro de novo
    async handleRequest({ url, page, retries = 1 }) {
        try {
            const finalUrl = `${url}?tid=${page}`
            // dispara uma requisição 
            const result = await this.request.makeRequest({
                url: finalUrl,
                method: 'get',
                timeout: this.maxRequestTimeout
            })

            return result

        } catch (error) {
            if (retries === this.maxRetries) {
                console.error(`[${retries}] max retries reached!`)
                // explode erro final
                throw error
            }
            // Tentou a primeira vez e deu erro 
            console.error(`[${retries}] an error: [${error.message}] has happened! trying again in ${this.retryTimeout}ms`)
            // colocamos o await pq retorna uma promise - esperar para tentar outra requisição 
            await Pagination.sleep(this.retryTimeout)
            // tenta de novo e adiciona 1 no retries
            return this.handleRequest({ url, page, retries: retries += 1 })
        }
    }
    // cria como um membro static pq não precisa olhar para o contexto this
    static async sleep(ms) {
        // faz o sleep para ele descansar 
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     Os generators sao usados para trabalhar com dados sob demanda
     precisamos anotar a funcao com * e usar o yield para retornar dados sob demanda
     quando usamos o yield { 0 }

     o retorno pode ser { done: false, value: 0 }
     const r = getPaginated()
     r.next() -> { done: false, value: 0 }
     r.next() -> { done: true, value: 0 }

     quando queremos delegar uma execucao (nao retornar valor, delegar!)

     yield* funcao

     * 
     */

    async * getPaginated({ url, page }) {
        // handle request só é recursivo se der errado // aqui só vem sucesso 
        const result = await this.handleRequest({ url, page })
        // pego o ultimo id da pagina- se não retornou undefined tenta buscar a propriedade tid = se for undefined ou null retorna 0
        const lastId = result[result.length - 1]?.tid ?? 0

        // CUIDADO, mais 1M de requisicoes
        if (lastId === 0) return;
        // retorna o valor para quem chamou 
        yield result
        // espera para não derrubar a api 
        await Pagination.sleep(this.threshold)
        // delega a função - retorna o valor pra frente
        yield* this.getPaginated({ url, page: lastId })

    }

}

module.exports = Pagination