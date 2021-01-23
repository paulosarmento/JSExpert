const Request = require("./request");
const request = new Request()
async function scheduler() {
    // falar que o processo iniciou
    console.log('starting in...', new Date().toISOString())

    // faz um map nas requisições
    const requests = [
        { url: 'https://www.mercadobitcoin.net/api/BTC/ticker/'},
        { url: 'https://www.NAO_EXISTE.net'},
        { url: 'https://www.mercadobitcoin.net/api/BTC/orderbook/'},
    ]
    .map(data => ({
        ...data,
        timeout: 2000,
        method: 'get'
    }))
    .map(params => request.makeRequest(params))

    // retorna os dados da requisição e seu estado  -> status, value, reason
    const result = await Promise.allSettled(requests)
    // Criar array para salvar resposta das requisições 
    const allSucceeded = []
    const allFailed = []

    for(const { status, value, reason} of result) {
        // se a requisição tiver status rejected armazena no array allFailed
        if(status === 'rejected') {
            allFailed.push(reason)
            continue;
        }
        // se a requisição tiver status success armazena no array allSucceeded
        allSucceeded.push(value)
    } 

    console.log({
        allFailed,
        allSucceeded: allSucceeded,
        // allSucceeded: JSON.stringify(allSucceeded) 
    })

}



const PERIOD = 2000
setInterval(scheduler, PERIOD)




// https://www.mercadobitcoin.net/api/BTC/trades/?tid=5704

// const Pagination = require('./pagination')

// ;(async () => {
//     const pagination = new Pagination()
    
//     const firstPage = 770e3
//     const req = pagination.getPaginated({
//         url: 'https://www.mercadobitcoin.net/api/BTC/trades/',
//         page: firstPage
//     })
//     for await (const items of req) {
//         console.table(items)
//     }
// })()