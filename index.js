const CallType = require('mali-call-types')

/**
 * Mali param middleware. If the request object has the specified property
 * of specified type the middleware function is executed.
 * Only applies for <code>UNARY</code> and <code>RESPONSE_STREAM</code> call types.
 * @module mali-param
 *
 * @param  {String} paramName The name of the request object property
 * @param  {Options} options
 * @param  {String} options.type Optional type of the param specified by <code>paramName</code> within the request.
 *                                    Has to be one of possible values as returned by <code>typeof</code>.
 * @param  {Boolean} options.truthy optional check for truthiness on the param value within the request.
 *                                           Default: <code>false</code>
 * @param  {Function} fn The middleware function to execute
 *
 * @example
 * const param = require('mali-param')
 *
 * async function appendDocType (id, ctx, next) {
 *   ctx.req.id = 'user::'.concat(id)
 *   await next()
 * }
 *
 * app.use(param('id', { type'string', truthy: true }, appendDocType))
 */
module.exports = function (paramName, options, fn) {
  if (!fn && typeof options === 'function') {
    fn = options
    options = {}
  }

  return function param (ctx, next) {
    if (ctx.type === CallType.REQUEST_STREAM || ctx.type === CallType.DUPLEX) {
      return next()
    }

    let typeOk = options.type ? typeof ctx.req[paramName] === options.type : true
    if (!typeOk) {
      return next()
    }

    if (ctx.req.hasOwnProperty(paramName)) {
      if (options.truthy && !ctx.req[paramName]) {
        return next()
      }
      return fn(ctx.req[paramName], ctx, next)
    } else {
      return next()
    }
  }
}
