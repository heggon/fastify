import { afterAll, beforeAll, test, describe, expect, beforeEach} from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

//CATEGORIZA OS TESTES - QUANDO DAR ERRO APARECE SEPARADO
describe('Transactions routes', () => {
  //AGUARDA QUE O APP ESTEJA PRONTO - TENHA TERMINADO DE EXECUTAR
  beforeAll(async () => {
    await app.ready()
  })

  //DEPOIS QUE OS TESTES EXECUTAR FECHA O APP
  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all') //A CADA TESTE O BANCO É APAGADO
    execSync('npm run knex migrate:latest') //DEPOIS DE APAGADO ELE É CRIADO NOVAMENTE
  })

  //TESTES SÃO COMPOSTOS POR 3 PASSOS
  //DESCRITIVO DO TESTE Q FICA ALI NO CABEÇALHO
  //CHAMADA HTTP
  //VALIDAÇÃO SE DEU CERTO
  test('use can create a new transaction', async () => {
    //const response = 
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })
      .expect(201)
    
    //console.log(response.get('Set-Cookie'))  
  })

  test('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || []

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    ])
  })

  test('should be able to get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || []

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 5000,
      }),
    )
  })

  test('should be able to get the summary', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Credit transaction',
        amount: 5000,
        type: 'credit',
      })

    const cookies = createTransactionResponse.get('Set-Cookie') || []

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Debit transaction',
        amount: 2000,
        type: 'debit',
      })

    const summaryResponse = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summaryResponse.body.summary).toEqual({
      amount: 3000,
    })
  })
})