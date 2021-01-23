const { describe, it, before, afterEach } = require('mocha')
const assert = require('assert')
const Request = require('../src/request')
// Resetar o estado a cada alteração 
const { createSandbox } = require('sinon')
// modulo do node
const Events = require('events')


describe('Request helpers', () => {
    const timeout = 15
    let sandbox
    let request

    // popula as variaveis
    before(() => {
        sandbox = createSandbox()
        request = new Request()
    })

    // sempre limpar o estado a cada it
    afterEach(() => sandbox.restore())
    // Deve cortar a conexão e devolver um erro se passar do tempo da requisição 
    it(`should throw a timeout error when the function has spent more than ${timeout}ms`, async () => {
        const exceededTimeout = timeout + 10

        // quando chamar o get ele vai retornar uma Promise -> simular uma chamada que excede o timeout
        sandbox.stub(request, request.get.name)
            .callsFake(() => new Promise(r => setTimeout(r, exceededTimeout)))


        const call = request.makeRequest({ url: 'https://testing.com', method: 'get', timeout })

        // assert.rejects -> para não usar try catch
        await assert.rejects(call, { message: 'timeout at [https://testing.com] :(' })
    })

    // deve retornar ok quando o tempo da promessa estiver ok
    it(`should return ok when promise time is ok`, async () => {
        const expected = { ok: 'ok' }

        // set o timeout com tempo quase imediato e retorna expected
        sandbox.stub(request, request.get.name)
            .callsFake(async () => {
                await new Promise(r => setTimeout(r))
                return expected
            })

        // metodo que retorna a chamada
        const call = () => request.makeRequest({ url: 'https://testing.com', method: 'get', timeout })

        // faz a asserção para nao rejeitar
        await assert.doesNotReject(call())

        // valida o valor da chamada
        assert.deepStrictEqual(await call(), expected)

    })
    // deve retornar um objeto JSON após uma solicitação
    it('should return a JSON object after a request', async () => {

        // simular o que a web traz 
        const data = [
            Buffer.from('{"ok": '),
            Buffer.from('"ok"'),
            Buffer.from('}'),
        ]

        const responseEvent = new Events()
        const httpEvent = new Events()

        // importa o modulo interno do nodejs https
        const https = require('https')
        sandbox
            .stub(
                https,
                https.get.name
            )
            // capturar o callback
            .yields(responseEvent)
            .returns(httpEvent)
            

        const expected = { ok: 'ok' }
        const pendingPromise = request.get('https://testing.com')
        
        // Envio dos pedaços do json da lista 
        responseEvent.emit('data', data[0])
        responseEvent.emit('data', data[1])
        responseEvent.emit('data', data[2])

        //falar que acabou nossa requisição 
        responseEvent.emit('end')
        

        const result = await pendingPromise
        // quando fizer a asserção quero que meu result seja igual ao expected
        assert.deepStrictEqual(result, expected)

    })

})