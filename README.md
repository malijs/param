# mali-param

[![Greenkeeper badge](https://badges.greenkeeper.io/malijs/param.svg)](https://greenkeeper.io/)

Mali request param middleware

[![npm version](https://img.shields.io/npm/v/mali-param.svg?style=flat-square)](https://www.npmjs.com/package/mali-param)
[![build status](https://img.shields.io/travis/malijs/param/master.svg?style=flat-square)](https://travis-ci.org/malijs/param)

## API

<a name="module_mali-param"></a>

### mali-param
Mali param middleware. If the request object has the specified property
of specified type the middleware function is executed.
Only applies for <code>UNARY</code> and <code>RESPONSE_STREAM</code> call types.


| Param | Type | Description |
| --- | --- | --- |
| paramName | <code>String</code> | The name of the request object property |
| options | <code>Options</code> |  |
| options.type | <code>String</code> | Optional type of the param specified by <code>paramName</code> within the request.                                    Has to be one of possible values as returned by <code>typeof</code>. |
| options.truthy | <code>Boolean</code> | optional check for truthiness on the param value within the request.                                           Default: <code>false</code> |
| fn | <code>function</code> | The middleware function to execute |

**Example**  

```js
const param = require('mali-param')

async function appendDocType (id, ctx, next) {
  ctx.req.id = 'user::'.concat(id)
  await next()
}

app.use(param('id', { type'string', truthy: true }, appendDocType))
```

## License

  Apache-2.0
