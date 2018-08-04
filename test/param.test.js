import test from 'ava'
import path from 'path'
import pify from 'pify'
import caller from 'grpc-caller'
import Mali from 'mali'

import param from '../'

const fs = pify(require('fs'))

function getRandomInt (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function getHostport (port) {
  return '0.0.0.0:'.concat(port || getRandomInt(1000, 60000))
}

const PROTO_PATH = path.resolve(__dirname, './param.proto')
const DYNAMIC_HOST = getHostport()
const apps = []
let client

test.before('should dynamically create service', t => {
  function handler (ctx) {
    ctx.res = ctx.req
  }

  const app = new Mali(PROTO_PATH, 'ParamService')
  t.truthy(app)
  apps.push(app)

  app.use(param('param1', { type: 'string' }, async (param1, ctx, next) => {
    const msg = ctx.req.message || ''
    ctx.req.message = msg.concat(':param1=', param1)
    await next()
  }))

  app.use(param('param2', { truthy: true }, async (param2, ctx, next) => {
    const msg = ctx.req.message || ''
    ctx.req.message = msg.concat(':param2=', param2.toString())
    await next()
  }))

  const param3mw = param('param3', async (param3, ctx, next) => {
    const msg = ctx.req.message || ''
    ctx.req.message = msg.concat(':param3=', param3.toString())
    await next()
  })

  const param3mw2 = param('param3', { type: 'boolean' }, async (param3, ctx, next) => {
    const fstr = await fs.readFile(path.resolve(__dirname, '../package.json'), 'utf8')
    const fc = JSON.parse(fstr)
    const msg = ctx.req.message || ''
    ctx.req.message = msg.concat(':param3=', param3.toString(), ':', fc.name)
    await next()
  })

  app.use('do1', handler)
  app.use('do2', param3mw, handler)
  app.use('do3', param3mw2, handler)
  const server = app.start(DYNAMIC_HOST)

  t.truthy(server)

  client = caller(DYNAMIC_HOST, PROTO_PATH, 'ParamService')
})

test('Should catch param 1', async t => {
  t.plan(3)
  const response = await client.do1({ message: 'msg', param1: 'foo' })
  t.truthy(response)
  t.truthy(response.message)
  t.is(response.message, 'msg:param1=foo')
})

test('Should catch param 2 when param 1 not specified', async t => {
  t.plan(3)
  const response = await client.do1({ message: 'msg', param2: 10 })
  t.truthy(response)
  t.truthy(response.message)
  t.is(response.message, 'msg:param2=10')
})

test('Should catch param 1 and param 2', async t => {
  t.plan(3)
  const response = await client.do1({ message: 'msg', param1: 'foo', param2: 11 })
  t.truthy(response)
  t.truthy(response.message)
  t.is(response.message, 'msg:param1=foo:param2=11')
})

test('Should catch param 1 and no param 2', async t => {
  t.plan(3)
  const response = await client.do2({ message: 'msg', param1: 'foo' })
  t.truthy(response)
  t.truthy(response.message)
  t.is(response.message, 'msg:param1=foo')
})

test('Should catch param 3', async t => {
  t.plan(3)
  const response = await client.do2({ message: 'msg', param1: 'foo', param2: 12, param3: true })
  t.truthy(response)
  t.truthy(response.message)
  t.is(response.message, 'msg:param1=foo:param2=12:param3=true')
})

test('Should catch param 3 mw 2', async t => {
  t.plan(3)
  const response = await client.do3({ message: 'msg', param1: 'bar', param2: 13, param3: false })
  t.truthy(response)
  t.truthy(response.message)
  t.is(response.message, 'msg:param1=bar:param2=13:param3=false:mali-param')
})

test.after.always('guaranteed cleanup', t => {
  apps.forEach(app => app.close())
})
